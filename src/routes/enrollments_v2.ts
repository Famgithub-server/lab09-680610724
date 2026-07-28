import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import { authenticateToken } from "@src/middlewares/authenMiddleware.js";
import { authAdmin } from "@src/middlewares/authAdmin.js";
import type { User, CustomRequest } from "../libs/types.js";
import { users, reset_users, enrollments, students, courses } from "../db/db.js";
import { zCourseId, zEnrollmentBody, zStudentId } from "@src/libs/zodValidators.js";
import { authRoles } from "@src/middlewares/authRoles.js";

const router = Router();

//api/v2/enrollments
router.get("/", authenticateToken, (req: Request, res: Response) => {
    try {
        const payload = (req as CustomRequest).user;
        const studentId = payload?.studentId;

        if (payload?.role === "ADMIN") {
            return res.status(200).json({
                ok: true,
                enrollments,
            })
        }  
        if (payload?.role === "STUDENT") {
            return res.status(200).json({
                ok: true,
                enrollments: enrollments.filter((e) => e.studentId === payload?.studentId),
            })
        } else {
            return res.status(400).json({
                ok: false,
                message: "Validation failed"
            })
        }
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: error,
        })
    }
})

router.post("/", authenticateToken, (req: Request, res: Response) => {
    try {
        const payload = (req as CustomRequest).user;
        if (payload?.role === "ADMIN") {
            return res.status(403).json({
                ok: true,
                message: "Only Student can access this API route",
            });
        } else {
            return res.status(200).json({
                ok: true,
                message: "Wow, You're student",
            });
        }
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: error,
        })
    }
})

router.delete("/", authenticateToken, (req: Request, res: Response) => {
    try {
        const payload = (req as CustomRequest).user;
        const {courseId} = req.body;
        const parse = zCourseId.safeParse(courseId);

        if (!parse.success && !payload) {
            return res.status(400).json({
                ok: false,
                message: "Validation failed"
            })
        }

        if (payload?.role === "ADMIN") {
            return res.status(403).json({
                ok: true,
                message: "Only Student can access this API route",
            });
        }

        const studentId = payload?.studentId;

        const idx = enrollments.findIndex(
            (e) => e.studentId === studentId && e.courseId === courseId
        );

        if (idx == -1) {
            return res.status(404).json({
                ok: false,
                message: "Enrollment does not exist",
            });
        }

        enrollments.splice(idx, 1);

        return res.status(200).json({
            ok: true,
            message: "You has dropped from this course. See you next semester.",
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: error,
        })
    }
});

export default router;