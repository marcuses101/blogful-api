const UsersService = {
  getAllUsers(knex){
    return knex.select('*').from('blogful_users')
  },
 async insertUser(knex, newUser){
   const rows = await knex
   .into('blogful_users')
   .insert(newUser)
   .returning('*');
   return rows[0];
 },
  getUserById(knex, id){
    return knex
    .from('blogful_users')
    .select('*')
    .where('id',id)
    .first();
  },
  deleteUser(knex, id){
    return knex('blogful_users')
    .where({id})
    .delete();
  },
  updateUser(knex, id, newUserFields){
    return knex('blogful_users')
    .where({id})
    .update(newUserFields)
  }
}

module.exports = UsersService;