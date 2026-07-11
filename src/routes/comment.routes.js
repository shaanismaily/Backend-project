import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {
    getVideoComments,
    updateComment,
    addComment,
    deleteComment
} from "../controllers/comment.controller.js"

const router = Router();
router.use(verifyJWT)

router
  .route("/:videoId/comments").get(getVideoComments).post(addComment);

router
  .route("/c/:commentId").patch(updateComment).delete(deleteComment)

export default router;