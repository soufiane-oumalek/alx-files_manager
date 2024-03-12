import {
  createHash,
} from 'crypto';
import {
  ObjectId,
} from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const {
      email,
      password,
    } = req.body;
    if (!email) {
      res.status(400).send({
        error: 'Missing email',
      });
      return;
    }
    if (!password) {
      res.status(400).send({
        error: 'Missing password',
      });
      return;
    }
    const users = dbClient.db.collection('users');

    const user = await users.findOne({
      email,
    });
    if (user) {
      res.status(400).send({
        error: 'Already exist',
      });
      return;
    }

    const hash = createHash('sha1').update(password).digest('hex');
    const newUser = await users.insertOne({
      email,
      password: hash,
    });
    const json = {
      id: newUser.insertedId,
      email,
    };
    res.status(201).send(json);
  }

  static async getMe(req, res) {
    const authToken = req.header('X-Token') || null;
    if (!authToken) {
      res.status(401).send({
        error: 'Unauthorized',
      });
      return;
    }
    const token = `auth_${authToken}`;
    const user = await redisClient.get(token);
    if (!user) {
      res.status(401).send({
        error: 'Unauthorized',
      });
      return;
    }
    const users = dbClient.db.collection('users');
    const userDoc = await users.findOne({
      _id: ObjectId(user),
    });
    if (userDoc) {
      res.status(200).send({
        id: user,
        email: userDoc.email,
      });
    } else {
      res.status(401).send({
        error: 'Unauthorized',
      });
    }
  }
}

export default UsersController;
