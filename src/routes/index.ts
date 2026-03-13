import { Router } from 'express'
import authRoutes from './auth.routes'
// Future routes imported here as they are built:
// import userRoutes from './user.routes'
// import studentRoutes from './student.routes'
// import taskRoutes from './task.routes'
// import attendanceRoutes from './attendance.routes'
// import announcementRoutes from './announcement.routes'

const router = Router()

//  Mount routes
router.use('/auth', authRoutes)
// router.use('/users', userRoutes)
// router.use('/students', studentRoutes)
// router.use('/tasks', taskRoutes)
// router.use('/attendance', attendanceRoutes)
// router.use('/announcements', announcementRoutes)

export default router