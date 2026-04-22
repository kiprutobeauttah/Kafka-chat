const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function saveMessage(user, message) {
  try {
    await prisma.messages.create({
      data: {
        user,
        message,
      },
    });
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
}

async function getMessages(limit = 50) {
  try {
    const messages = await prisma.messages.findMany({
      orderBy: {
        id: 'asc',
      },
      take: limit,
    });
    return messages;
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
}

async function saveUser(username, password) {
  try {
    await prisma.users.create({
      data: {
        username,
        password,
      },
    });
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
}

async function findUser(username) {
  try {
    const user = await prisma.users.findUnique({
      where: {
        username,
      },
    });
    return user;
  } catch (error) {
    console.error('Error finding user:', error);
    throw error;
  }
}

async function getAllUsers() {
  try {
    const users = await prisma.users.findMany({
      select: {
        username: true,
      },
      orderBy: {
        username: 'asc',
      },
    });
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = { saveMessage, getMessages, saveUser, findUser, getAllUsers };
