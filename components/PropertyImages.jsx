"use client";
import Image from "next/image";
import { Gallery, Item } from "react-photoswipe-gallery";

const PropertyImages = ({ images }) => {
  // Function to determine the correct image URL
  const getImageUrl = (img) => {
    return img.startsWith("http") ? img : `/properties/${img}`;
  };

  return (
    <Gallery>
      <section className="bg-blue-50 p-4">
        <div className="container mx-auto">
          {images.length === 1 ? (
            <Item
              original={getImageUrl(images[0])}
              thumbnail={getImageUrl(images[0])}
              width="1000"
              height="600"
            >
              {({ ref, open }) => (
                <Image
                  ref={ref}
                  onClick={open}
                  src={getImageUrl(images[0])}
                  alt=""
                  className="object-cover h-[400px] mx-auto rounded-xl"
                  width={1800}
                  height={400}
                  priority={true}
                />
              )}
            </Item>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {images.map((image, index) => (
                <div
                  key={index}
                  className={`
                  ${
                    images.length === 3 && index === 2
                      ? "col-span-2"
                      : "col-span-1"
                  }
                `}
                >
                  <Item
                    original={getImageUrl(image)}
                    thumbnail={getImageUrl(image)}
                    width="1000"
                    height="600"
                  >
                    {({ ref, open }) => (
                      <Image
                        ref={ref}
                        onClick={open}
                        src={getImageUrl(image)}
                        alt=""
                        className="object-cover h-[400px] w-full rounded-xl cursor-pointer"
                        width={0}
                        height={0}
                        sizes="100vw"
                        priority={true}
                      />
                    )}
                  </Item>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Gallery>
  );
};
export default PropertyImages;
