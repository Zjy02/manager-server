//用户管理模块

const router = require('koa-router')()
const Role = require('../models/roleSchema')
const util = require('../utils/util')
const jwt = require('jsonwebtoken')
router.prefix('/roles')
const md5 = require('md5')
const { pager } = require('../utils/util')

//
router.get('/allList',async(ctx)=>{
  const list = await Role.find({},"_id roleName")
  try {
    ctx.body = util.success(list)
  } catch (error) {
    ctx.body = util.fail(`查询失败${error}`)
  }
})
//按页查询角色列表
router.get('/list', async(ctx)=>{
  const { roleName} = ctx.request.query
  const { page,skipIndex} = util.pager(ctx.request.query)
  try {
    let params = {}
    if(roleName) params.roleName = roleName
    const query = Role.find(params)
    const list = await query.skip(skipIndex).limit(page.pageSize)
    const total = await Role.countDocuments(params)
    ctx.body = util.success({
      list,
      page:{
        ...page,
        total
      },
      total
    })
  } catch (error) {
    ctx.body = util.fail(`查询失败${error.stack}`)
  }
})

//角色操作: 创建 删除 和编辑
router.post('/operate', async (ctx)=>{
  const {_id,roleName,remark,action} = ctx.request.body
  let res , info
  try {
    if(action == 'create'){
      res = await Role.create({ roleName,remark})
      info = "创建成功"
    }else if(action == 'edit'){
      if(_id){
        let params = { roleName,remark}
        params.updateTime = new Date()
        res = await  Role.findByIdAndUpdate(_id,params)
        info = "编辑成功"
      }else{
        ctx.body =util.fail("缺少参数params._id")
        return
      }
    }else {
      if(_id){
        res = await Role.findByIdAndRemove(_id)
        info = '删除成功'
      }else{
        ctx.body =util.fail("缺少参数params._id")
        return
      }
    }
    ctx.body =util.success(res,info)
  } catch (error) {
    ctx.body =util.fail(info + error)
  }
})
router.post('/update/permission', async (ctx)=>{
  const { _id, permissionList } = ctx.request.body

  try {
    let params = {permissionList, updateTime: new Date()}
    let res = await Role.findByIdAndUpdate(_id, params)
    ctx.body =util.success("","权限设置成功")
  } catch (error) {
    ctx.body =util.fail(`权限设置失败${error.stack}`)
  }
})
module.exports = router
