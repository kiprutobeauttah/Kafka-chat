const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function saveMessage(user, message) {
  try {
    const msg = await prisma.messages.create({
      data: {
        user,
        message,
      },
    });
    return msg;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
}

async function deleteMessage(messageId, username, deleteForEveryone) {
  try {
    if (deleteForEveryone) {
      await prisma.messages.update({
        where: { id: messageId },
        data: { deletedForAll: true }
      });
    } else {
      const message = await prisma.messages.findUnique({
        where: { id: messageId }
      });
      const deletedFor = message.deletedFor ? JSON.parse(message.deletedFor) : [];
      deletedFor.push(username);
      await prisma.messages.update({
        where: { id: messageId },
        data: { deletedFor: JSON.stringify(deletedFor) }
      });
    }
  } catch (error) {
    console.error('Error deleting message:', error);
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

module.exports = { saveMessage, getMessages, saveUser, findUser, getAllUsers, deleteMessage };
