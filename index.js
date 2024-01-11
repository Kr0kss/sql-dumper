const { WebhookClient } = require('discord.js')
const { webhook, dump } = require('./config/config.json')
const { createGzip } = require('zlib')
const fs = require('fs')
const client = new WebhookClient({ url: webhook })
const mysqldump = require('mysqldump')
const del = require('del')
const { EmbedBuilder } = require('discord.js');

const executeDump = async () => {
    if(!dump || typeof dump != 'object' || !dump.host  || !dump.database || !dump.user){
        console.error('[SERVER] Something went wrong, you defined incorrectly your config.json')
        return
    }
    const date = new Date()
    const folder = './cache'
    const fileName = `dump-${date.getDate() < 10 ? '0'+date.getDate() : date.getDate()}-${(date.getMonth() + 1) < 10 ? '0'+(date.getMonth() + 1) : date.getMonth() + 1}-${date.getFullYear()}_${date.getHours() < 10 ? '0'+date.getHours() : date.getHours()}-${date.getMinutes() < 10 ? '0'+date.getMinutes() : date.getMinutes()}-${date.getSeconds() < 10 ? '0'+date.getSeconds() : date.getSeconds()}.sql`
    const fileDir = `${folder}/${fileName}`
    const fileZip = fileDir+'.gz'
    if (!fs.existsSync(folder)){
        fs.mkdirSync(folder)
    }
    try {
        await mysqldump({
            connection: {
                host: dump.host,
                user: dump.user,
                password: dump.password,
                database: dump.database,
            },
            dumpToFile: fileDir
        })
    } catch (err) {
        console.log('[ERROR] Something went wrong when creating the file.')
        return false
    }
    const zip = createGzip()

    const read = fs.createReadStream(fileDir)
    const write = fs.createWriteStream(fileZip)
    read.pipe(zip).pipe(write)
    await new Promise(r => setTimeout(r,1000))
    del(fileDir).catch(() => {})

    return fileZip
}

const taskDump = async () => {
    if(!dump || typeof dump != 'object' || !dump.database){
        console.error('[SERVER] Something went wrong, you defined incorrectly your config.json')
        return
    } 
    const EmbedKroksLog = new EmbedBuilder()
    .setURL('https://krokss.com/')
	.setAuthor({ name: 'AutoDumpSystem', iconURL: 'https://cdn.discordapp.com/avatars/1195085017773252741/6de3f71339a8a1bbd5ed95ea9cdd3f5b.png?size=4096', url: 'https://krokss.com/' })
	.setFooter({ text: 'kroksj\'s SQL-Dump System', iconURL: 'https://cdn.discordapp.com/avatars/1195085017773252741/6de3f71339a8a1bbd5ed95ea9cdd3f5b.png?size=4096' })
    .setTimestamp()
    .setDescription('DATE: ' + String(new Date()))
    .setColor('#2b2d31');

    const fileDir = await executeDump()
    if(fileDir){
        try {
            await client.send({
                embeds: [EmbedKroksLog],
                files: [String(fileDir)] 
            })
        } catch (err) {
            console.log(err)
            console.log('[ERRO] When sending the file to the webhook.')
        }
    }
    console.log(fileDir)
    setTimeout(taskDump, (dump.cooldown || 10) * 60 * 1000)
}

setTimeout(taskDump, (dump.cooldown || 10) * 60 * 1000)
console.log('[SERVER] Webhook connected!')