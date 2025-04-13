export default function getRelativeImagePath(fileName) {
  // If the fileName is already an absolute URL, return it as is
  if (fileName.startsWith("http")) {
    return fileName;
  }

  // Otherwise, prepend the path for local images
  return `${process.env.NEXT_PUBLIC_DOMAIN}/properties/${fileName}`;
}
