const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbpath = path.join(__dirname, 'todoApplication.db')
const app = express()
app.use(express.json())

let db = null

const inisilizeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running on http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB ERROR : ${error.message} `)
    process.exit(1)
  }
}
inisilizeDbAndServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}
const hasPriorityProperties = requestQuery => {
  return requestQuery.priority !== undefined
}
const hasStatusProperties = requestQuery => {
  return requestQuery.status !== undefined
}

// API  1 /todos/?status=TO%20DO Returns a list of all todos whose status is 'TO DO'

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''

  const {search_q = '', priority, status} = request.query
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND status = "${status}" AND priority = "${priority}"
    `
      break
    case hasPriorityProperties(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND priority = "${priority}"
    `
      break
    case hasStatusProperties(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND status = "${status}"
    `
      break
    default:
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%"
    `
  }
  data = await db.all(getTodosQuery)
  response.send(data)
})
// specific id get
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId}`
  const todo = await db.get(getTodoQuery)
  response.send(todo)
})

// API POST Create a todo in the todo table,

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const postQuery = `
  INSERT INTO todo (id,todo,priority,status) VALUES (${id},"${todo}","${priority}","${status}")
  `
  const insertVlues = await db.run(postQuery)
  response.send('Todo Successfully Added')
})

// secnorie 1 API PUT pdates the details of a specific todo based on the todo ID
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColunm = ''
  const requestBody = request.body
  switch (true) {
    case requestBody.status !== undefined:
      updateColunm = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColunm = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColunm = 'Todo'
      break
  }
  const postQuery = `
  SELECT * FROM todo WHERE id = ${todoId};
  `
  const privioustodo = await db.get(postQuery)
  const {
    todo = privioustodo.todo,
    priority = privioustodo.priority,
    status = privioustodo.status,
  } = request.body

  const updateTodoQuery = `UPDATE todo SET todo = "${todo}",priority = "${priority}", status = "${status}" WHERE id = ${todoId}`
  const updated = await db.run(updateTodoQuery)
  response.send(`${updateColunm} Updated`)
})

// delete
app.delete('/todos/:todoId/', async (request, response) => {
  const {todo, priority, status} = request.body
  const {id} = request.params
  const postQuery = `
  DELETE FROM todo WHERE id
  `
  await db.run(postQuery)
  response.send('Todo Deleted')
})

module.exports = app
