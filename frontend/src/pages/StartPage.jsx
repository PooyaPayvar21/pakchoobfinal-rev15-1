// noinspection ES6CheckImport
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Start.css";

function Start() {
  const navigate = useNavigate();
  return (
    <div className="start-container z-10">
      <div className="start-wrapper">
        <form>
          <h1 className="text-center text-2xl font-mono">ورود کارکنان</h1>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                navigate("/login", { state: { userType: "pm" } });
              }}
              className="w-full h-[50px] bg-[#fff] border-[none] 
              outline-[none] rounded-[40px] [box-shadow:0_0_10px_rgba(0,_0,_0,_0.1)] 
              cursor-pointer text-[16px] text-[#333] font-bold mt-[45px] mx-[0] mb-[15px]"
            >
              CEO
            </button>
            <button
              type="button"
              onClick={() => {
                navigate("/login", { state: { userType: "technician" } });
              }}
              className="w-full h-[50px]
               bg-[#fff] border-[none] outline-[none] 
               rounded-[40px] [box-shadow:0_0_10px_rgba(0,_0,_0,_0.1)] 
               cursor-pointer text-[16px] text-[#333] font-bold mt-[45px] mx-[0] mb-[15px]"
            >
              Departman
            </button>
            <button
              type="button"
              onClick={() => {
                navigate("/login", { state: { userType: "operator" } });
              }}
              className="w-full h-[50px] bg-[#fff] border-[none] 
              outline-[none] rounded-[40px] [box-shadow:0_0_10px_rgba(0,_0,_0,_0.1)] 
              cursor-pointer text-[16px] text-[#333] font-bold mt-[45px] mx-[0] mb-[15px]"
            >
              PM
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Start;
