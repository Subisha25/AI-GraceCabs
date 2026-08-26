import React from "react";
import { Mail, Phone } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import config from "../../../../src/config/config";
import appLogo from "../../../assets/logo.png";

type CompanyData = {
  companyId: string;
  companyName: string;
  companyLogo: string;
  seoUrl: string;
};

const UserLoginHeader: React.FC<{ companyData: CompanyData | null }> = ({ companyData }) => {
  const BASE_URL = config.baseurl.apibaseurl;
  const { seoUrl } = useParams();   // for redirect

  const logoSrc =
    companyData?.companyLogo
      ? `${BASE_URL}/uploads/companyLogo/${companyData.companyLogo}`
      : null;

  return (
    <header className="w-full bg-white shadow-sm">
      
      <div className="w-full bg-[#1B4F8A] border-b border-blue-800 text-sm hidden sm:block">
        <div className="container mx-auto px-4 py-1 flex justify-between items-center text-white">
          <div className="flex items-center space-x-2 opacity-80">
            <Mail size={14} />
            <span className="text-[13px]">support@swiftride.app</span>
          </div>

          <div className="flex items-center space-x-2 opacity-80">
            <Phone size={14} />
            <span className="text-[13px]">+1 800-SWIFTRIDE</span>
          </div>
        </div>
      </div>

      {/* 🟢 Logo Row */}
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* ✅ LEFT SIDE – PLATFORM LOGO (DO NOT REMOVE) */}
        <div>
          <Link to={`/company/${seoUrl}`}>
            <img
              src={appLogo}
              alt="Platform Logo"
              className="h-12 object-contain cursor-pointer"
            />
          </Link>
        </div>

        {/* ✅ RIGHT SIDE – COMPANY LOGO (API BASED) */}
        <div>
          {logoSrc && (
            <img
              src={logoSrc}
              alt={companyData?.companyName || "Company Logo"}
              className="w-[160px] h-[60px] object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          )}
        </div>

      </div>
    </header>
  );
};

export default UserLoginHeader;