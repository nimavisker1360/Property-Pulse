export default function getRelativeImagePath(fileName) {
  // If the fileName is already an absolute URL, return it as is
  if (fileName.startsWith("http")) {
    return fileName;
  }

  // For local files, simply use the relative path
  return `/properties/${fileName}`;
}
