import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler( async(req, res) => {
    const { channelId } = req.params

    if (channelId === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const subscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    console.log(subscription)

    if (subscription) {
        await Subscription.findByIdAndDelete(subscription._id)
    } else {
        const newSubscription = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })
        if (!newSubscription) {
            throw new ApiError(500, "Something went wrong while toggling the subscription")
        }
    }

    return res.status(200).json(new ApiResponse(200, {}, "Toggled subscribe status"))
})

const getUserChannelSubscribers = asyncHandler( async(req, res) => {
    const { channelId } = req.params

    const subscribers = await Subscription.find({ 
        channel: channelId 
    }).populate("subscriber", "username avatar")

    return res.status(200).json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"))
})

const getSubscribedChannels = asyncHandler( async(req, res) => {
    const { subscriberId } = req.params

    const channels = await Subscription.find({ 
        subscriber: subscriberId
    }).populate("channel", "username avatar")

    return res.status(200).json(new ApiResponse(200, channels, "Channels fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}