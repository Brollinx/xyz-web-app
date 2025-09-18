import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

const SearchResultsPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center space-y-6 w-full max-w-md">
        <h1 className="text-4xl font-bold text-gray-900">Search Results</h1>
        <p className="text-lg text-gray-600">
          This page will display your search results.
        </p>
        <div className="flex w-full max-w-sm items-center space-x-2 mx-auto">
          <Input type="text" placeholder="Search..." className="flex-grow" />
          <Button type="submit">
            <Search className="h-4 w-4 mr-2" /> Search
          </Button>
        </div>
        <Button variant="link" asChild>
          <Link to="/">Back to Landing Page</Link>
        </Button>
      </div>
    </div>
  );
};

export default SearchResultsPage;