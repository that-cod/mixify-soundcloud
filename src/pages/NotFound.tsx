
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Disc3, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-mixify-purple/20 flex items-center justify-center">
              <Disc3 className="h-10 w-10 text-mixify-purple-light" />
            </div>
          </div>
          <h1 className="text-6xl font-bold mb-4 text-mixify-purple-light">404</h1>
          <p className="text-2xl text-white mb-6">Track not found</p>
          <p className="text-white/70 mb-8">
            The page you're looking for is missing or has been moved to another location.
          </p>
          <Link to="/">
            <Button className="bg-mixify-purple hover:bg-mixify-purple-dark">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default NotFound;
