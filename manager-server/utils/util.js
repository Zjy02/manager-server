/**
 * 通用工具
*/ 

const log4js = require('./log4js')
const jwt = require('jsonwebtoken')

const CODE = {
    SUCCESS: 200,
    PARAM_ERROR: 10001, //参数错误
    USER_ACCOUNT_ERROR: 20001, // 账号或密码错误
    USER_LOGIN_ERROR:30001, // 用户未登录
    BUSINESS_ERROR: 40001, //业务请求失败
    AUTH_ERROR: 500001, // 认证失败TOKEN过期
}

module.exports  = {
    /**
     * 分页结构封装
     * @param {number} pageNum 
     * @param {number} pageSize 
     */
    pager ({pageNum = 1,pageSize = 10}){
        pageNum*=1;
        pageSize*=1;
        const skipIndex = (pageNum-1)*pageSize;
        return {
            page:{
                pageNum,
                pageSize
            },
            skipIndex
        }
    },

    success(data='', msg='', code = CODE.SUCCESS){
        log4js.debug(data)
        return {
            code,data,msg
        }
    },
    fail(msg='',code=CODE.BUSINESS_ERROR,data=''){
        log4js.debug(msg)
        return {
            code,data,msg
        }
    },
    CODE,
    //解密
    decoded(authorization){
        if(authorization){
            let token = authorization.split(' ')[1]
            return jwt.verify(token,'zjy')
          }
          return ''
    },
    //递归拼接列表树
    getTreeMenu(rootList, id, list) {
        for (let i = 0; i < rootList.length; i++) {
            let item = rootList[i]
            if (String(item.parentId.slice().pop()) == String(id)) {
                list.push(item._doc)
            }
        }
        list.map(item => {
            item.children = []
            this.getTreeMenu(rootList, item._id, item.children)
            if (item.children.length == 0) {
                delete item.children;
            } else if (item.children.length > 0 && item.children[0].menuType == 2) {
                // 快速区分按钮和菜单，用于后期做菜单按钮权限控制
                item.action = item.children;
            }
        })
        return list;
    },
    formatDate(date,rule){
        let fmt = rule || 'yyyy-MM-dd hh:mm:ss'
        if(/(y+)/.test(fmt)){
            fmt = fmt.replace(/(y+)/.exec(fmt)[1], (date.getFullYear() + '').substring(4 - /(y+)/.exec(fmt)[1].length))
        }
        const o = {
            "M+":date.getMonth() + 1,
            "d+":date.getDate(),
            "h+":date.getHours(),
            "m+":date.getMinutes(),
            "s+":date.getSeconds(),
        }

        for(let k in o){
            const re = new RegExp(`(${k})`)
            if(re.test(fmt)){
                const val = o[k] + '';
                fmt = fmt.replace(re.exec(fmt)[1], re.exec(fmt)[1].length == 1? val : ('00'+val).substring(val.length))
            }
        }
        return fmt
    },
}