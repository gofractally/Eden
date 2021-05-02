import toast from "react-hot-toast";

export const onError = (error: Error, title = "") => {
    console.error(title, error);
    const message = error.toString();
    toast.error((t) => (
        <div>
            {title && (
                <>
                    {title}
                    <br />
                </>
            )}
            {message}
        </div>
    ));
};
