const { ipcRenderer } = require ('electron')


import './index.css';
import './recording'
import { renderMeeting } from './recording'


ipcRenderer.on('get-recordings',(e,data)=>{
    document.querySelector('.sk-rotating-plane').classList.add('listMeetings')
    document.querySelector('.sk-rotating-plane').classList.remove('sk-rotating-plane')
    renderMeeting(data)
})

ipcRenderer.on('start-download',(e,id)=>{
    console.log(id)
    document.getElementById(id).classList.remove('enable')
    document.getElementById(id).classList.add('lds-facebook')
    document.getElementById(id).innerHTML = '<div></div><div></div><div></div>'
})

ipcRenderer.on('finish-download',(e,id)=>{
    if(document.getElementById(id)){
        document.getElementById(id).classList.remove('lds-facebook')
        document.getElementById(id).innerHTML = ''
        document.getElementById(id).classList.add('dissable')
        document.getElementById(id).innerText = 'Скачан'
    }
})

