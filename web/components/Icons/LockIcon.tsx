export const LockIcon = (props: { className: string }) => {
  const { className } = props;
  return (
    <svg
      width="24"
      height="24"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.75 6.75C8.75 4.95507 10.2051 3.5 12 3.5C13.7949 3.5 15.25 4.95507 15.25 6.75V8H8.75V6.75ZM7.25 8.0702V6.75C7.25 4.12665 9.37665 2 12 2C14.6234 2 16.75 4.12665 16.75 6.75V8.0702C18.6006 8.42125 20 10.0472 20 12V18C20 20.2091 18.2091 22 16 22H8C5.79086 22 4 20.2091 4 18V12C4 10.0472 5.39935 8.42125 7.25 8.0702ZM14 15C14 16.1046 13.1046 17 12 17C10.8954 17 10 16.1046 10 15C10 13.8954 10.8954 13 12 13C13.1046 13 14 13.8954 14 15Z"
        fill="currentcolor"
      />
    </svg>
  );
};
