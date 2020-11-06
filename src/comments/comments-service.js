const CommentsService = {
  getAllComments(knex){
    return knex
    .select('*')
    .from('blogful_comments');
  },
  async insertComment(knex, comment){
  const rows = await knex
    .into('blogful_comments')
    .insert(comment)
    .returning('*');
    return rows[0];
  },
  getCommentById(knex, id){
    return knex
    .select('*')
    .from('blogful_comments')
    .where({id})
    .first();
  },
  deleteComment(knex, id){
    return knex('blogful_comments')
    .where({id})
    .delete();
  },
  updateComment(knex, id, newCommentFields){
    return knex('blogful_comments')
    .where({id})
    .update(newCommentFields);
  }
}

module.exports = CommentsService;