//用户管理模块

const router = require('koa-router')()
const User = require('./../models/userSchema')
const Menu = require('./../models/menuSchema')
const Role = require('./../models/roleSchema')
const Counter = require('./../models/counterSchema')
const util = require('./../utils/util')
const jwt = require('jsonwebtoken')
router.prefix('/users')
const md5 = require('md5')

//用户登录
router.post('/login',async(ctx)=>{
  try {
      const {userName, userPwd} =ctx.request.body;
      //返回数据库指定的字段 三种方式
      //1 ,'userId userName userEmail state role deptId roleList'
      //2 ,{userId: 1,_id:0} (1为返回 0为不返回)
      //3 .select(''userId)
      console.log("password",userPwd)
      console.log("up in password")
      const res = await User.findOne({
        userName,
        userPwd: md5(userPwd)
      },'userId userName userEmail state role deptId roleList')
      const data = res._doc
      const token = jwt.sign({
        data
      },'zjy',{ expiresIn: '1h'})
      console.log("res=>",res)

      if(res) {
        data.token = token
        ctx.body = util.success(data,"登陆成功!")
      }else{
        ctx.body = util.fail('账号密码不正确')
      }
  } catch (error) {
    ctx.body = util.fail(error.msg)
  }
})

//用户列表
router.get('/list',async(ctx)=>{
  const { 
    userId,
    userName,
    state
  } = ctx.request.query

  const {  page, skipIndex } = util.pager(ctx.request.query)
  let params = {}
  if(userId)params.userId = userId
  if(userName)params.userName = userName
  if(state && state != '0')params.state = state
  const query = User.find(params,{_id:0,userPwd:0})
  const list = await query.skip(skipIndex).limit(page.pageSize)
  const total = await User.countDocuments(params)

  try {
    ctx.body = util.success({
      page:{
        ...page,
        total
      },
      list
    })
  } catch (error) {
    ctx.body = util.fail(`查询异常:${error.stack}`)  
  }

})
//用户删除和批量删除
router.post('/delete', async(ctx)=>{
  const { userIds } = ctx.request.body
  // User.updateMany({ $or:[ {userId:1001} , {userId:1002} ]})
  const res = await User.updateMany({ userId: { $in: userIds } } ,{ state:2 })
  if(res.modifiedCount){
    ctx.body = util.success(res,`共删除${res}条数据`)
    return
  }
  ctx.body = util.fail('删除失败！')
})
//用户新增/编辑
router.post('/operate',async(ctx)=>{
  const { userId, userName, userEmail, job, state, mobile, roleList, deptId, action } = ctx.request.body
  if( action == 'add'){
    if(!userName || !userEmail || !deptId){
      ctx.body = util.fail("参数错误",util.CODE.PARAM_ERROR)
      return
    }
    const res = await User.findOne({ $or: [{ userName}, { userEmail}]}, "_id userName userEmail")
    if (res) {
      ctx.body = util.fail(`系统监测到有重复的用户，信息如下：${res.userName} - ${res.userEmail}`)
    } else {
      try {
        const doc = await Counter.findOneAndUpdate( { _id: 'userId' }, { $inc: { sequence_value: 1 } } )
        const user = new User({
          userId:doc.sequence_value,
          userPwd:md5('123456'),
          userEmail,
          userName,
          role:1,
          roleList,
          job,
          state,
          deptId,
          mobile
        })
        user.save()
        ctx.body = util.success('','创建成功')
      } catch (error) {
        ctx.body = util.fail(error.stack,'创建失败')
      }
    }
  }else{
    if(!deptId) {
      ctx.body = util.fail("部门不能为空",util.CODE.PARAM_ERROR)
      return
    }
    try {
      const res = await User.findOneAndUpdate({userId }, {job, state, mobile, roleList, deptId })
      ctx.body = util.success({},"更新成功")
      return
    } catch (error) {
      ctx.body = util.fail(error.stack,'更新失败')
    }
  }
})
//获取全部用户列表
router.get('/all/list', async (ctx)=>{
  try {
    const list = await User.find({},"userId userName userEmail")
    ctx.body = util.success(list)
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})
//获取用户对应权限菜单
router.get('/getPermissionList', async (ctx)=>{
  //获取请求头的authorization拿到token
  let authorization = ctx.request.headers.authorization
  //对token进行解密 拿到用户的角色信息
  let {data} = util.decoded(authorization)
  let menuList = await getMenuList(data.role,data.roleList)
  //根据用户的角色信息 来获取用户有哪些权限
  let actionList = getActionList(JSON.parse(JSON.stringify(menuList)))
  ctx.body = util.success({menuList,actionList})
})
//获取用户的菜单列表
async function getMenuList(userRole,roleKeys){
  let rootList = []
  if(userRole == 0){
    rootList  = await Menu.find({}) || []
  } else {
    let roleList = await Role.find({_id: { $in: roleKeys}})
    let permissionList = []
    roleList.map(role => {
      let { checkedKeys,halfCheckedKeys} = role.permissionList
      permissionList = permissionList.concat([...checkedKeys,...halfCheckedKeys])
    })
    permissionList = [...new Set(permissionList)]
    rootList = await Menu.find({_id: { $in: permissionList}})
  }
  return util.getTreeMenu(rootList, null ,[]);
}
//获取权限按钮
function getActionList(list){
  let actionList = []
  const deep = (arr)=>{
    while(arr.length){
        let item = arr.pop()
        if(item.action){
          item.action.map(action =>{
            actionList.push(action.menuCode)
          })
        }
        if(item.children && !item.action){
            deep(item.children)
        }
    }
}
  deep(list)
  return actionList
}

module.exports = router
