const mongoose = require('mongoose')

const menuSchema = mongoose.Schema({
    menuType:Number,
    menuName:String,
    menuCode:String,
    path:String,
    icon:String,
    component:String,
    menuState:Number,
    parentId:[mongoose.Types.ObjectId],
    "createTime":{
        type:Date,
        default: Date.now()
        },              //创建时间
    "lastLoginTime":{
        type:Date,
        default: Date.now()
        },              //更新时间
    remark:String
})

module.exports = mongoose.model("menu",menuSchema,"menus") //第三个参数值集合的名称