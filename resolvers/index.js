const resolvers = {
  Query: {
    users: async (_, args, context) => {
      return await context.db.select('*').from('users');
    }
  }
};

module.exports = resolvers;
