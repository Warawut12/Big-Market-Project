import React from "react";

const Image = () => {
  return (
    <>
      <div className="max-w-380 mx-auto px-4 pt-10 pb-16 text-center bg-white border border-gray-200 rounded-xl shadow-lg">
        <div className="max-w-70 mx-auto bg-orange-500 text-white mx-150 items-center bg-brand-softer border border-brand-subtle text-fg-brand-strong text-2xl font-medium px-1.5 py-0.5 rounded-sm mb-5">
          <h1>เเผนผังตลาด</h1>
        </div>
        <div className="max-w-380 mx-auto px-10">
          <img src="/img/ex.jpg" alt="market_place" />
        </div>
      </div>
    </>
  );
};

export default Image;
