import React from "react";
import Header from "../components/Common/Header";

const ResetPassword = () => {
  const isLight = document.documentElement.classList.contains("light");
  return (
    <div className="flex-1 overflow-hidden relative z-10">
      <Header title="Reset Password" />
      <main className="flex min-h-screen items-center mx-auto justify-center">
        {" "}
        <div
          className={`w-full max-w-3xl backdrop-blur-md rounded-2xl shadow-xl border ${
            isLight
              ? "bg-white/90 border-gray-200"
              : "bg-gray-800/60 border-gray-700"
          }`}
        >
          <div className="p-6 ">
            <div className="mb-6 text-center">
              {/* <h2
                className={`${
                  isLight ? "text-gray-900" : "text-gray-1000"
                } text-2xl font-bold`}
              >
                Reset Password
              </h2> */}
              <form onSubmit="" className="space-y-6 ">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      className={`${
                        isLight ? "text-gray-600" : "text-gray-400"
                      } text-md block mb-2`}
                    >
                      Password
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 rounded-lg border ${
                        isLight
                          ? "bg-white text-gray-900 border-gray-300"
                          : "bg-gray-900 text-gray-100 border-none"
                      } focus:ring-1 focus:ring-blue-700`}
                    />
                  </div>
                  <div>
                    <label
                      className={`${
                        isLight ? "text-gray-600" : "text-gray-400"
                      } text-md block mb-2`}
                    >
                      Confirm Password
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 rounded-lg border ${
                        isLight
                          ? "bg-white text-gray-900 border-gray-300"
                          : "bg-gray-900 text-gray-100 border-none"
                      } focus:ring-1 focus:ring-blue-700`}
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    className={`w-full cursor-pointer py-3 rounded-lg font-semibold transition-colors ${
                      isLight
                        ? "bg-blue-600 text-white hover:bg-blue-400"
                        : "bg-blue-600 text-white hover:bg-blue-400"
                    }`}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
