const requestForDownload = require('request')
const fs = require('fs')
const { net } = require('electron')

module.exports.request = request = async (dateTo, dateFrom, userId, token) => {
    let data = []
    let store = {}
    const options = {
        "method": "GET",
        "hostname": "api.zoom.us",
        "port": null,
        "path": `/v2/users/${userId}/recordings?trash_type=meeting_recordings&to=${dateTo}&from=${dateFrom}&mc=false&page_size=300`,
        "headers": {
            "authorization": `Bearer ${token}`
        }
    }
    let promise = await new Promise((resolve,reject)=>{
        const req = net.request(options)
        req.on('response', res => {
            res.on('data',(chunk)=>{
                data.push(chunk)
            })
            res.on('end', ()=>{
                let body = Buffer.concat(data)
                store = JSON.parse(body.toString())
                resolve(store)
            })
        })
        req.end()
    })
    return promise
    
}

module.exports.downloadFile = downloadFile = (url_download, save_path) =>{
    const req = requestForDownload({
        method: 'GET',
        uri: url_download
    })
    const out = fs.createWriteStream(save_path);
    req.pipe(out);
    req.on('end', () => {
        console.log("file download");
    });
}
