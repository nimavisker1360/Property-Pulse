"use server";
import connectDB from "@/config/database";
import Property from "@/models/Property";
import { getSessionUser } from "@/utils/getSessionUser";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import cloudinary from "@/config/cloudinary";

async function addProperty(formData) {
  await connectDB();

  const sessionUser = await getSessionUser();

  if (!sessionUser || !sessionUser.userId) {
    throw new Error("User ID is required");
  }

  const { userId } = sessionUser;

  // Access all values for amenities and images
  const amenities = formData.getAll("amenities");
  const images = formData.getAll("images").filter((image) => image.name !== "");

  // Create the propertyData object with embedded seller_info
  const propertyData = {
    type: formData.get("type"),
    name: formData.get("name"),
    description: formData.get("description"),
    location: {
      street: formData.get("location.street"),
      city: formData.get("location.city"),
      state: formData.get("location.state"),
      zipcode: formData.get("location.zipcode"),
    },
    beds: formData.get("beds"),
    baths: formData.get("baths"),
    square_feet: formData.get("square_feet"),
    amenities,
    rates: {
      weekly: formData.get("rates.weekly"),
      monthly: formData.get("rates.monthly"),
      nightly: formData.get("rates.nightly."),
    },
    seller_info: {
      name: formData.get("seller_info.name"),
      email: formData.get("seller_info.email"),
      phone: formData.get("seller_info.phone"),
    },
    owner: userId,
  };

  // Validate Cloudinary configuration
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error(
      "Cloudinary configuration is missing. Please check your environment variables."
    );
  }

  const imageUrls = [];

  for (const imageFile of images) {
    try {
      const imageBuffer = await imageFile.arrayBuffer();
      const imageArray = Array.from(new Uint8Array(imageBuffer));
      const imageData = Buffer.from(imageArray);

      // Get the MIME type from the file, default to jpeg if not available
      const mimeType = imageFile.type || "image/jpeg";

      // Convert the image data to base64
      const imageBase64 = imageData.toString("base64");

      // Make request to upload to Cloudinary with correct MIME type
      const result = await cloudinary.uploader.upload(
        `data:${mimeType};base64,${imageBase64}`,
        {
          folder: "propertypulse",
        }
      );

      imageUrls.push(result.secure_url);
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      if (
        error?.http_code === 401 ||
        error?.message?.includes("Invalid api_key") ||
        error?.message?.includes("Invalid cloud_name")
      ) {
        throw new Error(
          `Cloudinary authentication failed: ${
            error?.message || "Invalid API credentials"
          }. Please check your CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, and CLOUDINARY_CLOUD_NAME in your .env file.`
        );
      }
      throw new Error(
        `Failed to upload image: ${error?.message || "Unknown error occurred"}`
      );
    }
  }

  propertyData.images = imageUrls;

  const newProperty = new Property(propertyData);
  await newProperty.save();

  revalidatePath("/", "layout");

  redirect(`/properties/${newProperty._id}`);
}

export default addProperty;
