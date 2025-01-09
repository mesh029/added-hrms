
import { UseFormReturn, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Define Zod Schema
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  title: z.string().optional(),
  email: z.string().email({ message: "Invalid email address." }),
  role: z.string().min(1, { message: "Role is required." }),
  department: z.string().min(1, { message: "Department is required." }),
  address: z.string().min(1, { message: "Address is required." }),
  hireDate: z.date(),
  reportsTo: z.string().min(1, { message: "Reports To is required." }),
  leaveDays: z.number().min(0, { message: "Leave days must be a positive number." }),
  phone: z.string().optional(),
  facility: z.string().optional(),
  location: z.string().optional(),
  facilities: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
});



// Define TypeScript Types from the Schema
type FormData = z.infer<typeof formSchema>;


const predefinedFacilities = [
  "Nairobi Hospital", "Kenyatta National Hospital", "Aga Khan University Hospital",
  "Mater Hospital", "MP Shah Hospital", "Karen Hospital",
  "Gertrude's Children's Hospital", "Coptic Hospital", 
  "Nairobi Women's Hospital", "The Nairobi West Hospital"
];

const predefinedLocations = [
  "Nairobi", "Mombasa", "Kisumu", "Eldoret", "Nakuru",
  "Thika", "Malindi", "Garissa", "Nyeri", "Kitale"
];
interface FacilitiesAndLocationsInputProps {
  form: UseFormReturn<FormData>; // Unified the type
}


const FacilitiesAndLocationsInput = ({ form }: FacilitiesAndLocationsInputProps) => {
  const [facilitySearch, setFacilitySearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");

  const addItem = (type: "facilities" | "locations", item: string) => {
    const currentItems = form.getValues(type) || [];
    if (!currentItems.includes(item)) {
      form.setValue(type, [...currentItems, item]);
    }
  };

  const removeItem = (type: "facilities" | "locations", index: number) => {
    const updatedItems = [...(form.getValues(type) || [])];
    updatedItems.splice(index, 1);
    form.setValue(type, updatedItems);
  };

  const filteredFacilities = predefinedFacilities.filter(fac =>
    fac.toLowerCase().includes(facilitySearch.toLowerCase())
  );

  const filteredLocations = predefinedLocations.filter(loc =>
    loc.toLowerCase().includes(locationSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Facilities */}
      <div className="space-y-2">
        <label htmlFor="facilities">Select Facilities</label>
        <div className="flex flex-wrap gap-2">
          {form.watch("facilities")?.map((fac, index) => (
            <div key={index} className="flex items-center gap-2 bg-gray-200 px-2 py-1 rounded-md">
              {fac}
              <button type="button" onClick={() => removeItem("facilities", index)} className="text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <Input
          placeholder="Search facilities..."
          value={facilitySearch}
          onChange={(e) => setFacilitySearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {filteredFacilities.map((facility, index) => (
            <Button key={index} type="button" onClick={() => addItem("facilities", facility)} variant="outline">
              {facility}
            </Button>
          ))}
        </div>
      </div>

      {/* Locations */}
      <div className="space-y-2">
        <label htmlFor="locations">Select Locations</label>
        <div className="flex flex-wrap gap-2">
          {form.watch("locations")?.map((loc, index) => (
            <div key={index} className="flex items-center gap-2 bg-gray-200 px-2 py-1 rounded-md">
              {loc}
              <button type="button" onClick={() => removeItem("locations", index)} className="text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <Input
          placeholder="Search locations..."
          value={locationSearch}
          onChange={(e) => setLocationSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {filteredLocations.map((location, index) => (
            <Button key={index} type="button" onClick={() => addItem("locations", location)} variant="outline">
              {location}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FacilitiesAndLocationsInput;
