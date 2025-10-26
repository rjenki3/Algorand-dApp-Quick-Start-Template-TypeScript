// server.js — Local backend entry point
import app from './app.js'

const port = process.env.PORT || 3001

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Backend listening at http://localhost:${port}`)
})
