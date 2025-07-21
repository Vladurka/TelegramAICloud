import { User } from "../models/user.model.js";

export const authCallback = async (req, res, next) => {
  try {
    const { clerkId, firstName, lastName } = req.body;

    const existingUser = await User.findOne({ clerkId: clerkId });

    if (!existingUser) {
      const nameParts = [];
      if (firstName) nameParts.push(firstName);
      if (lastName) nameParts.push(lastName);
      const fullName = nameParts.join(" ");

      await User.create({
        clerkId,
        fullName,
      });
      res.status(201).json({ success: true, created: true });
    } else {
      res.status(200).json({ success: true, created: false });
    }
  } catch (error) {
    next(error);
  }
};
