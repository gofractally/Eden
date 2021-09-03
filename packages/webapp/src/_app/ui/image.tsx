import { ImgHTMLAttributes, useState } from "react";

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
    fallbackImage?: string;
}

export const Image = ({ fallbackImage, ...imgProps }: Props) => {
    const [src, setSrc] = useState(imgProps.src);

    const onError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        if (fallbackImage) {
            setSrc(fallbackImage);
        }

        if (imgProps.onError) {
            imgProps.onError(e);
        }
    };

    return <img {...imgProps} src={src} onError={onError} />;
};
