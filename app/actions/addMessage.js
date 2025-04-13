"use server";
import connectDB from "@/config/database";
import Message from "@/models/Message";
import User from "@/models/User";
import Property from "@/models/Property";
import { getSessionUser } from "@/utils/getSessionUser";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

async function addMessage(previousState, formData) {
  try {
    await connectDB();

    const sessionUser = await getSessionUser();

    if (!sessionUser || !sessionUser.user) {
      return { error: "You must be logged in to send a message" };
    }

    const { user } = sessionUser;

    const recipientId = formData.get("recipient");
    const propertyId = formData.get("property");
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone") || "";
    const body = formData.get("message") || "";

    // Validate required fields
    if (!propertyId) return { error: "Property is required" };
    if (!name) return { error: "Name is required" };
    if (!email) return { error: "Email is required" };

    console.log("User ID:", user.id);
    console.log("Property ID:", propertyId);

    // Get the property directly from the database
    const property = await Property.findById(propertyId);

    if (!property) {
      return { error: `Property not found with ID: ${propertyId}` };
    }

    // Debug the property and its owner
    console.log("Property found:", property._id);
    console.log("Owner field:", property.owner);

    let recipient;

    if (property.owner) {
      // Use property owner if available
      recipient = property.owner.toString();
    } else if (recipientId && recipientId !== "3") {
      // Use recipient from form if it's not the dummy value "3"
      recipient = recipientId;
    } else {
      // If no owner and no valid recipient, find the first admin user
      const adminUser = await User.findOne({ isAdmin: true }).exec();

      if (adminUser) {
        recipient = adminUser._id.toString();
        console.log("Using admin as recipient:", recipient);
      } else {
        // Last resort: use the first user in the database
        const firstUser = await User.findOne({}).exec();

        if (!firstUser) {
          return { error: "No recipient available for this message" };
        }

        recipient = firstUser._id.toString();
        console.log("Using first user as recipient:", recipient);
      }
    }

    if (!recipient) {
      return { error: "Could not determine a recipient for this message" };
    }

    if (user.id === recipient) {
      return { error: "You can not send a message to yourself" };
    }

    // Create message with proper owner ID
    const newMessage = new Message({
      sender: user.id,
      recipient: recipient,
      property: property._id,
      name,
      email,
      phone,
      body,
    });

    console.log("Message before save:", {
      sender: newMessage.sender,
      recipient: newMessage.recipient,
      property: newMessage.property,
    });

    await newMessage.save();

    revalidatePath("/messages");
    return { submitted: true };
  } catch (error) {
    console.error("Error in addMessage:", error.message);
    console.error("Full error stack:", error.stack);

    // Return more descriptive error message
    if (error.name === "ValidationError") {
      return { error: `Validation Error: ${error.message}` };
    } else if (error.name === "CastError") {
      return { error: `Invalid ID format: ${error.message}` };
    } else {
      return { error: `Failed to send message: ${error.message}` };
    }
  }
}

export default addMessage;
