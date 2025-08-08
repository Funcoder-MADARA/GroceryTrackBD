import mongoose from 'mongoose';

let memServer = null;

export async function connectToDatabase(uri) {
  if (uri === 'memory') {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memServer = await MongoMemoryServer.create();
    const memUri = memServer.getUri('order_profile_db');
    await mongoose.connect(memUri, { dbName: 'order_profile_db' });
    return memUri;
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  return uri;
}

export async function disconnectFromDatabase() {
  await mongoose.disconnect();
  if (memServer) {
    await memServer.stop();
    memServer = null;
  }
}