import React, { useState } from "react";

const Content = () => {
  

  
  return (
    <>
      <main
        className="max-w-380 mx-auto bg-white border border-gray-200 rounded-xl shadow-lg p-6 mb-10 mt-5"
        id="slot-select"
      >
        <div>
          <form>
            {/* <!-- วันที่ --> */}
            <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-xl shadow-lg p-6 my-8">
              <label
                htmlFor="date-select"
                className="block text-sm font-medium text-white text-center mb-1 box-border bg-orange-600 box-border border border-transparent shadow-xs font-medium leading-5 rounded-lg text-base px-5 py-3"
              >
                เลือกวันที่
              </label>
              <select
                defaultValue=""
                id="date-select"
                name="date-select"
                className="w-full bg-gray-50 border border-orange-400 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 p-2.5 text-center"
              >
                <option value="" disabled>
                  เลือกวันที่
                </option>
                <option value="date-1">วันที่ 1</option>
                <option value="date-2">วันที่ 2</option>
                <option value="date-3">วันที่ 3</option>
                <option value="date-4">วันที่ 4</option>
                <option value="date-5">วันที่ 5</option>
                <option value="date-6">วันที่ 6</option>
                <option value="date-7">วันที่ 7</option>
                <option value="date-8">วันที่ 8</option>
                <option value="date-9">วันที่ 9</option>
                <option value="date-10">วันที่ 10</option>
                <option value="date-11">วันที่ 11</option>
                <option value="date-12">วันที่ 12</option>
                <option value="date-13">วันที่ 13</option>
                <option value="date-14">วันที่ 14</option>
                <option value="date-15">วันที่ 15</option>
                <option value="date-16">วันที่ 16</option>
                <option value="date-17">วันที่ 17</option>
                <option value="date-18">วันที่ 18</option>
                <option value="date-19">วันที่ 19</option>
                <option value="date-20">วันที่ 20</option>
                <option value="date-21">วันที่ 21</option>
                <option value="date-22">วันที่ 22</option>
                <option value="date-23">วันที่ 23</option>
                <option value="date-24">วันที่ 24</option>
                <option value="date-25">วันที่ 25</option>
                <option value="date-26">วันที่ 26</option>
                <option value="date-27">วันที่ 27</option>
                <option value="date-28">วันที่ 28</option>
                <option value="date-29">วันที่ 29</option>
                <option value="date-30">วันที่ 30</option>
                <option value="date-31">วันที่ 31</option>
              </select>
            </div>
            {/* <!-- end วันที่ -->
                <!-- เลือกล็อก --> */}
            <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-xl shadow-lg p-6 my-8 py-5">
              <label
                htmlFor="slot-zone"
                className="block text-sm font-medium text-white text-center mb-1 box-border bg-orange-600 box-border border border-transparent shadow-xs font-medium leading-5 rounded-lg text-base px-5 py-3"
              >
                กรุณาเลือกล็อกตลาด
              </label>
              <select
                defaultValue=""
                id="slot-zone"
                name="market_zone"
                className="w-full bg-gray-50 border border-orange-400 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 p-2.5 text-center"
              >
                <option value="" disabled>
                  เลือกล็อก
                </option>
                <option value="slot-1">ล็อกที่ 1 [ตามเเผนผัง]</option>
                <option value="slot-2">ล็อกที่ 2 [ตามเเผนผัง]</option>
                <option value="slot-3">ล็อกที่ 3 [ตามเเผนผัง]</option>
                <option value="slot-4">ล็อกที่ 4 [ตามเเผนผัง]</option>
                <option value="slot-5">ล็อกที่ 5 [ตามเเผนผัง]</option>
                <option value="slot-6">ล็อกที่ 6 [ตามเเผนผัง]</option>
                <option value="slot-7">ล็อกที่ 7 [ตามเเผนผัง]</option>
                <option value="slot-8">ล็อกที่ 8 [ตามเเผนผัง]</option>
                <option value="slot-9">ล็อกที่ 9 [ตามเเผนผัง]</option>
                <option value="slot-10">ล็อกที่ 10 [ตามเเผนผัง]</option>
              </select>
            </div>
            {/* <!-- end เลือกล็อก --> */}
          </form>
          <div className="text-center">
            <div>
              <div>
                <button 
                  type="button"
                  id="confirm-btn"
                  className="bg-green-500 text-white bg-brand box-border border border-transparent hover:bg-green-700 focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-lg text-sm px-4 py-2.5 focus:outline-none"
                >
                  ยืนยัน
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Content;
