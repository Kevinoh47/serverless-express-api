'use strict';
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const AWS = require('aws-sdk');

const USERS_TABLE = process.env.USERS_TABLE;
const MESSAGES_TABLE = process.env.MESSAGES_TABLE;
const dynamoDb = new AWS.DynamoDB.DocumentClient();

app.use(bodyParser.json({ strict: false }))

app.get('/', function (req, res) {
  res.send('<h2>Hello World! Test Express Server</h2>');
})

// Get all messages:
app.get('/history', (req, res) => {
  const params = {
    TableName: MESSAGES_TABLE,
  };

  dynamoDb.scan(params, (error, result) => {
    if (error) {
      res.status(400).json({ error: 'Error retrieving Messages history.'});
    }
    console.log({result})
    const { Items: messages } = result;
    res.json({ messages });
  })
});

// Get Messages endpoint
app.get('/messages/:messageId', function(req, res){
  const params = {
    TableName: MESSAGES_TABLE,
    Key: {
      messageId: req.params.messageId,
    },
  }

  dynamoDb.get(params, (error,result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get message'});
    }
    if (result.Item) {
      const {messageId, timestamp, message, moniker, room} = result.Item;
      res.json( { messageId, timestamp, message, moniker, room });
    } else {
      res.status(404).json( { error: "message not found" });
    }
  });
})

// Create the Message endpoint.
app.post('/messages', function(req,res) {
  const { messageId, timestamp, message, moniker, room } = req.body;
  if (typeof messageId !== 'string') {
    res.status(400).json({ error: '"messageId" must be a string'});
  } else if (typeof timestamp !== 'string') {
    res.status(400).json({ error: '"timestamp" must be a string'});
  } else if (typeof message !== 'string') {
    res.status(400).json({ error: '"message" must be a string'});
  } else if (typeof moniker !== 'string') {
    res.status(400).json({ error: '"moniker" must be a string'});
  } else if (typeof room !== 'string') {
    res.status(400).json({ error: '"room" must be a string'});
  }

  const params = {
    TableName: MESSAGES_TABLE,
    Item: {
      messageId: messageId,
      timestamp: timestamp,
      message: message,
      moniker: moniker,
      room: room,
    },
  };

  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not create message'});
    }
    res.json({ messageId, timestamp, message, moniker, room })
  });
})

// Get User endpoint
app.get('/users/:userId', function(req, res){
  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: req.params.userId,
    },
  }

  dynamoDb.get(params, (error,result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get user'});
    }
    if (result.Item) {
      const {userId, name} = result.Item;
      res.json( { userId, name });
    } else {
      res.status(404).json( { error: "User not found" });
    }
  });
})

// Create the User endpoint.
app.post('/users', function(req,res) {
  const { userId, name } = req.body;
  console.log("users post request body: ", req.body);
  if (typeof userId !== 'string') {
    res.status(400).json({ error: '"userId" must be a string'});
  } else if (typeof name !== 'string') {
    res.status(400).json({ error: '"name" must be a string'});
  }

  const params = {
    TableName: USERS_TABLE,
    Item: {
      userId: userId,
      name: name,
    },
  };

  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not create user'});
    }
    res.json({ userId, name })
  });
})


module.exports.handler = serverless(app);