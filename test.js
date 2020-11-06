require('dotenv').config();
const knex = require('knex')
const createUsers = require('./test/users.fixtures')
const users = createUsers();

const db = knex({
  client:'pg',
  connection: process.env.TEST_DB_URL
}
)
console.log(users)
async function test (){
await db.insert(users).into('blogful_users');
}
(async()=>{
  await db.raw(`TRUNCATE blogful_articles, blogful_users, blogful_comments RESTART IDENTITY CASCADE`)
  await test();
})()