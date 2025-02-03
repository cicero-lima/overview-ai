import { Canvas, Rect, Text, Shadow } from "fabric";
import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Slider,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

const App = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [box, setBox] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [detectionBoxes, setDetectionBoxes] = useState<
    {
      height: number;
      left: number;
      top: number;
      width: number;
      class_name: string;
      confidence: number;
    }[]
  >([]);
  const [allDetectionBoxes, setAllDetectionBoxes] = useState<
    {
      height: number;
      left: number;
      top: number;
      width: number;
      class_name: string;
      confidence: number;
    }[]
  >([]);

  const allDetectionBoxesRef = useRef(0);
  const lastProcessedTimeRef = useRef(0);
  const [showTable, setShowTable] = useState(false);
  const [confidence, setConfidence] = useState(0.5);
  const [boxesAdded, setBoxesAdded] = useState(0);
  const boxesAddedRef = useRef(0);
  const [iou, setIou] = useState(0.3);
  const confidenceRef = useRef(confidence);
  const iouRef = useRef(iou);

  // Define the color palette
  const colors = [
    "red",
    "blue",
    "green",
    "yellow",
    "orange",
    "purple",
    "pink",
    "cyan",
    "lime",
    "brown",
    "gray",
    "teal",
    "indigo",
    "violet",
    "gold",
    "silver",
    "crimson",
    "magenta",
    "turquoise",
    "coral",
    "salmon",
    "orchid",
    "seashell",
    "peachpuff",
    "plum",
    "mediumslateblue",
    "darkslategray",
    "slateblue",
    "chocolate",
    "forestgreen",
  ];
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 5;
  const processFrame = async () => {
    const video = videoRef.current;
    if (video) {
      const currentTime = Date.now();
      if (currentTime - lastProcessedTimeRef.current < 5000) return;
      lastProcessedTimeRef.current = currentTime;

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      const ctx = tempCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
        const imageData = tempCanvas.toDataURL("image/jpeg");

        try {
          const response = await fetch(
            "https://project-overviewai.ploomber.app/detect",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                image_data: imageData,
                confidence: confidenceRef.current,
                iou: iouRef.current,
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();

            if (Array.isArray(data) && data.length > 0) {
              const updatedBoxes = data.map((item: any, index: number) => ({
                height: item.box.height,
                left: item.box.left,
                top: item.box.top,
                width: item.box.width,
                class_name: item.class_name,
                confidence: item.confidence,
                index,
              }));
              setAllDetectionBoxes((prevBoxes) => [
                ...prevBoxes,
                ...updatedBoxes,
              ]);
              setDetectionBoxes(updatedBoxes); // Update detection boxes
				console.log("===>"+boxesAddedRef.current);
              // Optionally, set the first box (or any other logic you prefer)
              if (boxesAddedRef.current < 10) {
                updatedBoxes.forEach((box) => addDetectionBox(box));
				console.log(allDetectionBoxesRef.current);
              }
            } else {
              setDetectionBoxes([]);
            }
            console.log(data);
          } else {
            console.error(
              "Error in response:",
              response.status,
              response.statusText
            );
          }
        } catch (error) {
          console.error("Error sending frame:", error);
        }
      }
    }
  };

  useEffect(() => {
    console.log("confidence=" + confidence);
    console.log("iou=" + iou);
    confidenceRef.current = confidence;
    iouRef.current = iou;
	allDetectionBoxesRef.current = allDetectionBoxes;
	boxesAddedRef.current = boxesAdded;
  }, [confidence, iou, allDetectionBoxes, boxesAdded]);

  const processStream = () => {
    processFrame();
    requestAnimationFrame(processStream);
  };

  useEffect(() => {
    processStream(); // Start processing the video stream

    if (!canvasRef.current) return;

    const newCanvas = new Canvas(canvasRef.current, {
      selection: false,
      backgroundColor: "transparent",
    });

    setCanvas(newCanvas);

    if (videoRef.current) {
      const updateCanvasSize = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const videoElement = videoRef.current;
        const canvasElement = canvasRef.current;

        // Adjust canvas size to match the video container
        const parent = videoElement.parentElement!;
        canvasElement.width = parent.clientWidth;
        canvasElement.height = parent.clientHeight;

        newCanvas.setWidth(parent.clientWidth);
        newCanvas.setHeight(parent.clientHeight);

        updateBoundingBox(newCanvas);
      };

      videoRef.current.onloadedmetadata = updateCanvasSize;

      // Watch for video size changes
      const resizeObserver = new ResizeObserver(updateCanvasSize);
      resizeObserver.observe(videoRef.current);

      return () => {
        resizeObserver.disconnect();
        newCanvas.dispose();
      };
    }
  }, []);

  const updateBoundingBox = (canvas: Canvas) => {
    if (!videoRef.current || !detectionBoxes.length) return;

    const videoElement = videoRef.current;

    // Here we can use the bounding boxes from detectionBoxes
    const scaleX = canvas.getWidth() / videoElement.videoWidth;
    const scaleY = canvas.getHeight() / videoElement.videoHeight;

    // Create a rectangle for each detected box
    detectionBoxes.forEach((box, index) => {
      const scaledBox = {
        left: box.left * scaleX,
        top: box.top * scaleY,
        width: box.width * scaleX,
        height: box.height * scaleY,
      };

      // Assign color based on the index of the detection box
      const color = colors[index % colors.length]; // Wrap around if there are more boxes than colors

      // Create the rectangle for each detection box with the assigned color
      const square = new Rect({
        left: scaledBox.left,
        top: scaledBox.top,
        width: scaledBox.width,
        height: scaledBox.height,
        fill: "", // No fill color
        stroke: color, // Use assigned color for the border
        strokeWidth: 2, // Border width
        rx: 3,
        ry: 3,
        selectable: false,
      });

      // Add label inside the detection box, positioned at the top-left corner
      const label = new Text(box.class_name, {
        left: scaledBox.left + 5, // Slightly inside from the left edge
        top: scaledBox.top + 5, // Slightly inside from the top edge
        fontSize: 16,
        fill: "white",
        fontFamily: "Arial",
        selectable: false,
        fontWeight: "bold", // Make the label stand out more
      });

      // Add shadow to the label for better readability
      label.shadow = new Shadow({
        color: "black",
        blur: 5,
        offsetX: 2,
        offsetY: 2,
      });

      canvas.add(square);
      canvas.add(label);
    });
  };

  const handleNext = () => {
    if ((currentPage + 1) * pageSize < allDetectionBoxes.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const addDetectionBox = async (box: {
    height: number;
    left: number;
    top: number;
    width: number;
    class_name: string;
    confidence: number;
  }) => {
    try {
      const response = await fetch(
        "https://overview-db.ploomber.app/add-detection-box",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(box),
        }
      );

      if (response.ok) {
        const newBox = await response.json();
        setAllDetectionBoxes((prevBoxes) => [...prevBoxes, box]); // Update the state with the new box
        console.log("Box added:", newBox);
		setBoxesAdded(prevBoxes => prevBoxes + 1);

      } else {
        console.error(
          "Failed to add detection box:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error adding detection box:", error);
    }
  };

  useEffect(() => {
    const fetchDetectionBoxes = async () => {
      try {
        const response = await fetch(
          "https://overview-db.ploomber.app/get-detection-boxes"
        );
        if (response.ok) {
          const data = await response.json();
          setAllDetectionBoxes(data); // Populate with existing detection boxes from the DB
		  setBoxesAdded(data.length);
        }
      } catch (error) {
        console.error("Error fetching detection boxes:", error);
      }
    };

    fetchDetectionBoxes();
  }, []);

  useEffect(() => {
    if (canvas && !detectionBoxes.length) {
      // Clear the canvas if there are no detection boxes
      canvas.clear();
      return;
    }

    if (!canvas || !detectionBoxes.length) return;

    canvas.clear();
    updateBoundingBox(canvas); // Update canvas with all detected boxes
  }, [canvas, detectionBoxes]);

  return (
    <Box
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <video
        ref={videoRef}
        controls
        crossOrigin="anonymous"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 1,
          position: "absolute",
        }}
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      <Button
        variant="contained"
        sx={{
          position: "absolute",
          top: "10px",
          right: "10px", // Align the button to the right
          zIndex: 10,
          backgroundColor: "primary.main",
        }}
        onClick={() => setShowTable(!showTable)}
      >
        {showTable ? "Hide Table" : "Show Table"}
      </Button>

      {showTable && (
        <Box
          sx={{
            position: "absolute",
            top: "10%", // Adjust as needed
            right: "5%", // Align the box to the right
            backgroundColor: "rgba(255, 255, 255, 0.8)", // Apply to the container
            padding: 2,
            maxWidth: "90%",
            zIndex: 10,
            borderRadius: "8px",
            boxShadow: 2,
          }}
        >
          <Button
            sx={{
              position: "absolute",
              top: "10px",
              right: "10px",
              zIndex: 10,
            }}
            onClick={() => setShowTable(false)}
          >
            X
          </Button>
          <Typography variant="h6">Detection Boxes</Typography>

          <Box sx={{ maxHeight: "400px", overflowY: "scroll" }}>
            <TableContainer
              component={Paper}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.8)", // Apply to the table container as well
              }}
            >
              <Table sx={{ minWidth: 650 }} aria-label="detection boxes table">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Class</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Confidence</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Height</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Width</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Top</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Left</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allDetectionBoxes
                    .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
                    .map((box, index) => (
                      <TableRow key={index}>
                        <TableCell>{box.class_name}</TableCell>
                        <TableCell>{box.confidence.toFixed(2)}</TableCell>
                        <TableCell>{box.height}</TableCell>
                        <TableCell>{box.width}</TableCell>
                        <TableCell>{box.top}</TableCell>
                        <TableCell>{box.left}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 2,
            }}
          >
            <Button
              variant="outlined"
              onClick={handlePrevious}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <Button
              variant="outlined"
              onClick={handleNext}
              disabled={
                (currentPage + 1) * pageSize >= allDetectionBoxes.length
              }
            >
              Next
            </Button>
          </Box>
        </Box>
      )}

      <Box
        sx={{ position: "absolute", top: "10px", left: "10px", zIndex: 100 }}
      >
        <Typography
          variant="h6"
          color="white"
          sx={{
            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)", // Apply shadow to the text
          }}
        >
          Confidence Threshold
        </Typography>

        <Slider
          value={confidence}
          onChange={(e, newValue) => setConfidence(newValue as number)}
          min={0}
          max={1}
          step={0.01}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${value}`}
        />
        <Typography
          variant="h6"
          color="white"
          sx={{
            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)", // Apply shadow to the text
          }}
        >
          IOU Threshold
        </Typography>

        <Slider
          value={iou}
          onChange={(e, newValue) => setIou(newValue as number)}
          min={0}
          max={1}
          step={0.01}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${value}`}
        />
      </Box>
    </Box>
  );
};

export default App;
