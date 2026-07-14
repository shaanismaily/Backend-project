import { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const videoLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  if (videoLike) {
    await Like.findByIdAndDelete(videoLike._id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video unliked successfully"));
  }

  await Like.create({
    video: videoId,
    likedBy: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const commentLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (commentLike) {
    await Like.findByIdAndDelete(commentLike._id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment unliked successfully"));
  }

  await Like.create({
    comment: commentId,
    likedBy: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment liked successfully"));
});

const toggleTweetLike = asyncHandler( async(req, res) => {
  const { tweetId } = req.params

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const tweet = await Tweet.findById(tweetId)

  if (!tweet) {
    throw new ApiError(404, "Tweet not found")
  }

  const likedTweet = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id
  })

  if (likedTweet) {
    await Like.findByIdAndDelete(likedTweet._id)

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Tweet unliked successfully"))
  }

  await Like.create({
    tweet: tweetId,
    likedBy: req.user._id
  })

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet liked successfully"))
})

const getLikedVideos = asyncHandler( async(req, res) => {
  const likedVideos = await Like.find({ 
    likedBy: req.user._id,
    video: { $exists: true } 
  }).populate("video")

  return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"))
})

export {
  toggleVideoLike,
  toggleCommentLike,
  toggleTweetLike,
  getLikedVideos
}