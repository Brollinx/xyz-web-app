import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
          Welcome to Your New App!
        </h1>
        <p className="text-xl text-gray-700 max-w-2xl mx-auto">
          This is your landing page. Start building amazing features here.
        </p>
        <div className="flex justify-center space-x-4">
          <Button asChild size="lg">
            <Link to="/search">Go to Search Results</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/">Learn More</Link>
          </Button>
        </div>
      </div>
      <div className="absolute bottom-4">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default LandingPage;