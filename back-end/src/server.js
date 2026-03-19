import express from 'express'

const app = express()

const hostname = 'localhost'
const port = 8017

app.get('/', (req, res) => {
  res.send('Hello World 123')
})

app.listen(port, hostname, () => {
  console.log(`Hello Chauhuyne, Im running at http://${hostname}:${port}`)
})