import React, { ImgHTMLAttributes, useState } from "react";

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
    fallbackImage?: string;
    loaderComponent?: React.ReactNode;
}

export const Image = ({
    fallbackImage,
    loaderComponent,
    ...imgProps
}: Props) => {
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const [src, setSrc] = useState(imgProps.src);

    const onError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        if (fallbackImage) {
            setSrc(fallbackImage);
        }

        if (imgProps.onError) {
            imgProps.onError(e);
        }
    };

    const onLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        setIsLoaded(true);

        if (imgProps.onLoad) {
            imgProps.onLoad(e);
        }
    };

    if (!loaderComponent) {
        return <img {...imgProps} src={src} onError={onError} />;
    }

    return (
        <>
            {!isLoaded && loaderComponent}
            <img
                {...imgProps}
                src={src}
                onError={onError}
                onLoad={onLoad}
                className={`${imgProps.className} ${isLoaded ? "" : "hidden"}`}
            />
        </>
    );
};
