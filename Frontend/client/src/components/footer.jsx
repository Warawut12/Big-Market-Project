

const Footer = () => {
  return (
    <>
      {/* <!-- footer --> */}
      <footer className="bg-white fixed bottom-0 left-0 z-20 w-full p-4 bg-neutral-primary-soft border-default shadow-sm md:flex md:items-center md:justify-between md:p-6">
        <span className="text-sm text-body sm:text-center">
          © 2026{" "}
          <a href="Teesuk" className="hover:underline">
            ตรีสุขถูกดี
          </a>
          . All Rights Reserved.
        </span>
        <ul className="bg-orange-600 text-white flex flex-wrap items-center mt-3 text-sm font-medium text-body sm:mt-0 box-border border border-transparent hover:bg-orange-700 focus:ring-4 shadow-xs font-medium leading-5 rounded-lg text-sm px-4 py-2.5 focus:outline-none">
          <li>
            <a
              href="https://www.facebook.com/profile.php?id=100062768096396"
              target="_blank"
              className="hover:underline"
            >
              Contact
            </a>
          </li>
        </ul>
      </footer>
      {/* <!-- end footer --> */}
    </>
  );
};

export default Footer;
