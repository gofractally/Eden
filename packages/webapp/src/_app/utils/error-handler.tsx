import toast from "react-hot-toast";

export const onError = (error: Error, title = "") => {
    console.error(title, error);

    let message = error.toString();
    message = message.replace("Error: assertion failure with message:", "");

    toast.error(
        <div>
            {title && (
                <>
                    <strong>{title}</strong>
                    <br />
                </>
            )}
            {message}
        </div>
    );
};
