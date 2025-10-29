import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import React, { useState } from "react";
import Logo from "@/assets/Logo.png"; // Import the logo as PNG

const LandingPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search-results?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-y-8 bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Top: Logo */}
      <div className="flex items-center justify-center">
        <img src={Logo} alt="Company Logo" className="h-24 w-24 object-contain" />
      </div>

      {/* Middle: Google-like Search Bar */}
      <div className="flex flex-col items-center justify-center w-full max-w-2xl px-4">
        <form onSubmit={handleSearchSubmit} className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder="Search for products..."
            className="flex-grow h-12 rounded-full px-6 shadow-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button type="submit" size="lg" className="rounded-full h-12 px-6 shadow-md">
            <Search className="h-5 w-5" />
          </Button>
        </form>
      </div>

      {/* Bottom: Three evenly spaced buttons */}
      <div className="w-full max-w-md flex justify-around space-x-4 pb-8">
        <Button
          variant="ghost"
          className="flex-1 text-lg py-6 rounded-lg hover:bg-blue-100 transition-colors"
          onClick={() => navigate("/nearby-stores")}
        >
          Nearby
        </Button>
        <Button
          variant="ghost"
          className="flex-1 text-lg py-6 rounded-lg hover:bg-blue-100 transition-colors"
          onClick={() => navigate("/featured-products")}
        >
          Featured
        </Button>
        <Button
          variant="ghost"
          className="flex-1 text-lg py-6 rounded-lg hover:bg-blue-100 transition-colors"
          onClick={() => console.log("Clicked Login")}
        >
          Login
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;