import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Tree } from "react-d3-tree";

const InteractiveTreeDiagram = () => {
  const [treeData, setTreeData] = useState({
    name: "Root",
    children: [],
  });
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [lineStyles, setLineStyles] = useState({});
  const [selectedLine, setSelectedLine] = useState(null);
  const containerRef = useRef(null);

  // Function to generate a unique ID for each connection
  const getConnectionId = (source, target) => {
    try {
      if (!source || !target) {
        console.log("Missing source or target:", { source, target });
        return "unknown_unknown";
      }
      // Handle both direct properties and data object
      const sourceName = source.data?.name || source.name || "root";
      const targetName = target.data?.name || target.name || "unknown";
      const id = `${sourceName}_${targetName}`.replace(/\s+/g, "_");
      console.log(
        "Generated connection ID:",
        id,
        "from source:",
        sourceName,
        "target:",
        targetName
      );
      return id;
    } catch (error) {
      console.error("Error generating connection ID:", error, {
        source,
        target,
      });
      return "error_" + Math.random().toString(36).substr(2, 9);
    }
  };

  // Function to update line style for a specific connection
  const updateLineStyle = (connectionId, style) => {
    console.log("Updating line style:", { connectionId, style });
    if (!connectionId) {
      console.log("No connection ID provided");
      return;
    }

    setLineStyles((prev) => {
      const newStyles = { ...prev };
      if (style === "solid") {
        // If solid is selected, remove the style to use default
        delete newStyles[connectionId];
      } else {
        newStyles[connectionId] = style;
      }
      console.log("New line styles:", newStyles);
      return newStyles;
    });

    setSelectedLine(connectionId);
    console.log("Selected line set to:", connectionId);
  };

  const [inputs, setInputs] = useState({
    rootName: "",
    nodeName: "",
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [subNodeName, setSubNodeName] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addNode = useCallback(() => {
    const { rootName, nodeName } = inputs;

    if (!rootName) return;

    const newNode = {
      name: nodeName || "New Node",
      children: [],
    };

    setTreeData((prevData) => ({
      name: rootName,
      children: [...(prevData.children || []), newNode],
    }));

    // Clear node input after adding
    setInputs((prev) => ({
      ...prev,
      nodeName: "",
    }));
  }, [inputs]);

  const handleNodeClick = (nodeDatum, e) => {
    e.stopPropagation();
    console.log("Node clicked:", nodeDatum);
    setSelectedNode(nodeDatum);
    setDialogOpen(true);
  };

  const handleAddSubNode = () => {
    console.log("Adding sub-node:", { selectedNode, subNodeName });

    if (!subNodeName.trim()) {
      console.log("Sub-node name is empty");
      setDialogOpen(false);
      return;
    }

    if (!selectedNode) {
      console.log("No node selected");
      return;
    }

    // Create a new node to add
    const newNode = {
      name: subNodeName.trim(),
      children: [],
    };

    // Function to recursively find and update the target node
    const updateTree = (node, targetNode) => {
      // Create a new node object to avoid reference issues
      const newNodeToAdd = { ...newNode };

      // If this is the target node (compare by name and depth as a simple check)
      if (
        node.name === targetNode.name &&
        ((!node.children && !targetNode.children) ||
          node.children?.length === targetNode.children?.length)
      ) {
        return {
          ...node,
          children: [...(node.children || []), newNodeToAdd],
        };
      }

      // If the node has children, process them
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: node.children.map((child) => updateTree(child, targetNode)),
        };
      }

      return node;
    };

    try {
      console.log(
        "Current tree data before update:",
        JSON.parse(JSON.stringify(treeData))
      );

      // Create a new tree with the updated node
      const updatedTree = updateTree(
        JSON.parse(JSON.stringify(treeData)),
        selectedNode
      );

      console.log("Updated tree data:", updatedTree);

      // Update the state with the new tree
      setTreeData(updatedTree);
    } catch (error) {
      console.error("Error updating tree:", error);
    }

    // Reset the form
    setSubNodeName("");
    setDialogOpen(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(0.5, scale + delta * 0.1), 2);
    setScale(newScale);
  };

  const renderNodeWithCustomStyles = ({
    nodeDatum,
    toggleNode,
    parent,
    path,
  }) => {
    const isRoot = nodeDatum.depth === 0;
    const baseSize = 85;
    const text = isRoot
      ? "ROOT"
      : nodeDatum.name.length > 8
      ? `${nodeDatum.name.substring(0, 8)}`
      : nodeDatum.name;

    // Create a temporary SVG text element to measure the text width
    const getTextWidth = (
      text,
      fontSize = "38px",
      fontFamily = "sans-serif"
    ) => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      context.font = `${fontSize} ${fontFamily}`;
      return context.measureText(text).width;
    };

    const textWidth = getTextWidth(text);
    const padding = 5; // 5px padding on each side
    const minWidth = baseSize * scale;
    const calculatedWidth = Math.max(minWidth, textWidth + padding * 2);

    const x = -calculatedWidth / 2;
    const y = (-baseSize * scale) / 2; // Keep the height fixed

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={calculatedWidth}
          height={baseSize * scale}
          fill={isRoot ? "#4f46e5" : "#10b981"}
          stroke="#1f2937"
          strokeWidth="1"
          rx="6"
          onClick={(e) => {
            e.stopPropagation();
            if (parent) {
              const connectionId = getConnectionId(parent, nodeDatum);
              setSelectedLine(connectionId);
            }
            handleNodeClick(nodeDatum, e);
          }}
          style={{
            cursor: "pointer",
            boxShadow:
              selectedLine &&
              parent &&
              getConnectionId(parent, nodeDatum) === selectedLine
                ? "0 0 0 2px #3b82f6"
                : "none",
          }}
        />
        <text
          fill="#ffffff"
          strokeWidth="0.5"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: "38px",
            fontWeight: "200",
            fontFamily: "sans-serif",
            pointerEvents: "none",
          }}
        >
          {text}
        </text>
        {nodeDatum.attributes?.type === "subNode" && (
          <text
            x={x + calculatedWidth / 2}
            y={y + baseSize * scale - 10}
            textAnchor="middle"
            style={{ fontSize: "12px", fill: "#ffffff" }}
          >
            {nodeDatum.attributes?.count || 0}
          </text>
        )}
      </g>
    );
  };

  const nodeDepth = (node) => {
    let depth = 0;
    let currentNode = node;
    while (currentNode.parent) {
      depth++;
      currentNode = currentNode.parent;
    }
    return depth;
  };

  const nodeSize = { x: 200, y: 150 }; // Significantly increased spacing for very large nodes
  const foreignObjectProps = { width: 1, height: 1, x: -50 };

  // Store the tree container ref
  const treeContainerRef = useRef(null);
  // Store the current tree data ref to access in event handlers
  const treeDataRef = useRef(treeData);

  // Update the ref when treeData changes
  useEffect(() => {
    treeDataRef.current = treeData;
  }, [treeData]);

  // Function to find node by ID in the tree
  const findNodeById = (node, id) => {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Function to get the class name for a path
  const getPathClassName = (linkData) => {
    const source = linkData.source;
    const target = linkData.target;
    const connectionId = getConnectionId(source, target);
    
    // Set a data attribute for easier selection
    if (linkData.target) {
      linkData.target.attributes = linkData.target.attributes || {};
      linkData.target.attributes['data-connection-id'] = connectionId;
    }

    const classes = ["tree-path"];
    const style = lineStyles[connectionId];
    
    // Add style class if it exists
    if (style) {
      classes.push(`${style}-path`);
    } else {
      classes.push("solid-path");
    }

    // Add selected class if this path is selected
    if (selectedLine === connectionId) {
      classes.push("selected");
    }

    return classes.join(" ");
  };

  // Path props for the tree component
  const pathProps = (linkData) => {
    try {
      if (!linkData || !linkData.source || !linkData.target) {
        console.error('Invalid linkData:', linkData);
        return {};
      }
      
      const source = linkData.source.data || linkData.source;
      const target = linkData.target.data || linkData.target;
      
      if (!source || !target) {
        console.error('Missing source or target in linkData:', { source, target });
        return {};
      }
      
      const connectionId = getConnectionId(source, target);
      const isSelected = selectedLine === connectionId;
      const lineStyle = lineStyles[connectionId] || 'solid';
      
      return {
        onClick: (event) => {
          event.stopPropagation();
          console.log('Path clicked - connectionId:', connectionId);
          setSelectedLine(connectionId);
        },
        onMouseEnter: (e) => {
          if (e.target) {
            e.target.style.stroke = "#3b82f6";
            e.target.style.strokeWidth = "3";
          }
        },
        onMouseLeave: (e) => {
          if (e.target) {
            if (!isSelected) {
              e.target.style.stroke = "#6b7280";
              e.target.style.strokeWidth = "2";
            }
          }
        },
        style: {
          cursor: "pointer",
          pointerEvents: "all",
          stroke: isSelected ? "#3b82f6" : "#6b7280",
          strokeWidth: isSelected ? "3" : "2",
          strokeDasharray: lineStyle === 'dashed' ? '5,3' : lineStyle === 'dotted' ? '2,2' : 'none',
          fill: 'none',
          transition: 'all 0.2s ease'
        },
        'data-connection-id': connectionId
      };
    } catch (error) {
      console.error('Error in pathProps:', error);
      return {};
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 2,
          overflow: "hidden",
          position: "relative",
          mb: 3,
        }}
        onWheel={handleWheel}
        ref={containerRef}
      >
        <Typography variant="h6" gutterBottom>
          Interactive Tree Diagram
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Root Name"
              name="rootName"
              value={inputs.rootName}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Node Name"
              name="nodeName"
              value={inputs.nodeName}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={addNode}
              disabled={!inputs.rootName}
              fullWidth
            >
              Add Root Node
            </Button>
          </Grid>
        </Grid>

        <Box
          ref={treeContainerRef}
          sx={{
            width: "100%",
            height: "70vh", // Use viewport height for better responsiveness
            minHeight: "500px", // Minimum height to ensure visibility
            border: "1px solid #e5e7eb",
            borderRadius: 1,
            p: 2,
            overflow: "auto", // Changed back to auto to allow scrolling if needed
            position: "relative",
            backgroundColor: "#f9f9f9",
            "& .rd3t-tree-container": {
              width: "100%",
              height: "100%",
              overflow: "visible",
              position: "relative",
            },
            "& .rd3t-svg": {
              width: "100%",
              height: "100%",
              "&:focus": {
                outline: "none",
              },
            },
            "&::-webkit-scrollbar": {
              width: "8px",
              height: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "#f1f1f1",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#888",
              borderRadius: "4px",
              "&:hover": {
                background: "#555",
              },
            },
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <Tree
              data={treeData}
              orientation="vertical"
              renderCustomNodeElement={renderNodeWithCustomStyles}
              nodeSize={nodeSize}
              translate={translate}
              separation={{ siblings: 1.5, nonSiblings: 1.5 }}
              enableLegacyTransitions={true}
              collapsible={false}
              shouldCollapseNeighborNodes={false}
              transitionDuration={0}
              zoomable={true}
              draggable={true}
              zoom={scale}
              scaleExtent={{ min: 0.5, max: 2 }}
              styles={{
                links: {
                  stroke: "#6b7280",
                  fill: "none",
                  strokeWidth: 2,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  pointerEvents: "all",
                },
                nodes: {
                  node: {
                    circle: {
                      fill: "#3e5d8c",
                      stroke: "#2c3e50",
                    },
                    name: {
                      fill: "#2c3e50",
                    },
                  },
                  leafNode: {
                    circle: {
                      fill: "#f39c12",
                      stroke: "#e67e22",
                    },
                    name: {
                      fill: "#2c3e50",
                    },
                  },
                },
              }}
              // Handle path clicks and apply styles
              pathFunc={(linkDatum, orientation, treeToSvg) => {
                console.log('pathFunc called with:', { linkDatum, orientation });
                try {
                  const { source, target } = linkDatum;
                  const sourceX = source.x || 0;
                  const sourceY = source.y || 0;
                  const targetX = target.x || 0;
                  const targetY = target.y || 0;
                  
                  // Get source and target data with fallback
                  const sourceData = source.data || source;
                  const targetData = target.data || target;
                  
                  const connectionId = getConnectionId(sourceData, targetData);
                  console.log('Generating path for connection:', connectionId);
                  
                  const pathStyle = lineStyles[connectionId];
                  
                  if (pathStyle === 'arrow') {
                    const dx = targetX - sourceX;
                    const dy = targetY - sourceY;
                    const angle = Math.atan2(dy, dx);
                    const arrowLength = 15;
                    const arrowX = targetX - arrowLength * Math.cos(angle);
                    const arrowY = targetY - arrowLength * Math.sin(angle);
                    
                    return `M${sourceX},${sourceY} L${arrowX},${arrowY} M${targetX},${targetY} l${-arrowLength * Math.cos(angle - Math.PI/6)},${-arrowLength * Math.sin(angle - Math.PI/6)} M${targetX},${targetY} l${-arrowLength * Math.cos(angle + Math.PI/6)},${-arrowLength * Math.sin(angle + Math.PI/6)}`;
                  }
                  
                  return `M${sourceX},${sourceY} L${targetX},${targetY}`;
                } catch (error) {
                  console.error('Error in pathFunc:', error);
                  return '';
                }
              }}
              // Handle node clicks - this will handle both node and link clicks
              onClick={(nodeData) => {
                try {
                  console.log('Node clicked:', nodeData);
                  
                  // If this is a child node and has a parent, select the line to the parent
                  if (nodeData.parent) {
                    const source = nodeData.parent.data || nodeData.parent;
                    const target = nodeData.data || nodeData;
                    const connectionId = getConnectionId(source, target);
                    console.log('Selecting line to parent:', connectionId);
                    setSelectedLine(connectionId);
                  }
                } catch (error) {
                  console.error('Error in node click handler:', error);
                }
              }}
              // Custom renderer for links
              pathClassFunc={(linkData) => {
                try {
                  const source = linkData.source.data || linkData.source;
                  const target = linkData.target.data || linkData.target;
                  const connectionId = getConnectionId(source, target);
                  const isSelected = selectedLine === connectionId;
                  const lineStyle = lineStyles[connectionId] || 'solid';
                  
                  return `tree-path ${lineStyle}-path ${isSelected ? 'selected' : ''}`;
                } catch (error) {
                  console.error('Error in pathClassFunc:', error);
                  return 'tree-path';
                }
              }}
              // Handle link clicks and styling
              pathProps={(linkData) => {
                try {
                  const source = linkData.source.data || linkData.source;
                  const target = linkData.target.data || linkData.target;
                  const connectionId = getConnectionId(source, target);
                  const isSelected = selectedLine === connectionId;
                  const lineStyle = lineStyles[connectionId] || 'solid';
                  
                  return {
                    onClick: (event) => {
                      event.stopPropagation();
                      console.log('Link clicked, setting selectedLine to:', connectionId);
                      setSelectedLine(connectionId);
                    },
                    style: {
                      cursor: 'pointer',
                      pointerEvents: 'all',
                      stroke: isSelected ? '#3b82f6' : '#6b7280',
                      strokeWidth: isSelected ? '3' : '2',
                      strokeDasharray: lineStyle === 'dashed' ? '5,3' : lineStyle === 'dotted' ? '2,2' : 'none',
                      fill: 'none',
                      transition: 'all 0.2s ease'
                    },
                    onMouseEnter: (e) => {
                      e.target.style.stroke = '#3b82f6';
                      e.target.style.strokeWidth = '3';
                    },
                    onMouseLeave: (e) => {
                      if (!isSelected) {
                        e.target.style.stroke = '#6b7280';
                        e.target.style.strokeWidth = '2';
                      }
                    },
                    'data-connection-id': connectionId
                  };
                } catch (error) {
                  console.error('Error in pathProps:', error);
                  return {};
                }
              }}
            />
          </div>
        </Box>
        {/* Add styles for different line types */}
        <style>
          {`
          .tree-path {
            stroke: #6b7280;
            stroke-width: 2px;
            fill: none;
            transition: all 0.3s ease;
            cursor: pointer;
            pointer-events: all !important;
          }
          
          .tree-path.selected {
            stroke: #3b82f6 !important;
            stroke-width: 4px !important;
            stroke-opacity: 1 !important;
          }
          
          .tree-path:hover {
            stroke: #3b82f6;
            stroke-width: 3px;
          }
          
          .solid-path {
            stroke-dasharray: none !important;
            stroke-linecap: round;
          }
          
          .dashed-path {
            stroke-dasharray: 10, 5 !important;
            stroke-linecap: round;
          }
          
          .dotted-path {
            stroke-dasharray: 2, 4 !important;
            stroke-linecap: round;
          }
          
          .arrow-path {
            stroke-dasharray: none !important;
            stroke-linecap: round;
            marker-end: url(#arrowhead) !important;
          }
          
          .tree-path:hover {
            stroke: #3b82f6;
            stroke-width: 3px;
          }
          
          /* Debug styles */
          .tree-path::after {
            content: attr(class);
            position: absolute;
            background: white;
            padding: 2px 5px;
            border: 1px solid #ccc;
            font-size: 10px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
          }
          
          .tree-path:hover::after {
            opacity: 1;
          }
          
          /* Debug logging */
          .tree-path {
            transition: all 0.3s ease;
          }
          
          .tree-path:hover {
            stroke: #3b82f6;
            stroke-width: 3px;
            animation: debug-blink 0.5s infinite alternate;
          }
          
          @keyframes debug-blink {
            from {
              stroke-opacity: 1;
            }
            to {
              stroke-opacity: 0;
            }
          }
        `}
        </style>

        {/* Arrow marker definition for arrow line style */}
        <svg style={{ height: 0, width: 0, position: "absolute" }}>
          <defs>
            <marker
              id="arrowhead"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L10,5 L0,10 Z" fill="#6b7280" />
            </marker>
          </defs>
        </svg>

        <Box
          sx={{
            position: "absolute",
            bottom: 20,
            right: 20,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            zIndex: 10,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            p: 1,
            borderRadius: 1,
            boxShadow: 1,
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant={
                selectedLine && lineStyles[selectedLine] === "solid"
                  ? "contained"
                  : "outlined"
              }
              size="small"
              disabled={!selectedLine}
              onClick={() => updateLineStyle(selectedLine, "solid")}
              sx={{ minWidth: "80px" }}
            >
              Solid
            </Button>
            <Button
              variant={
                selectedLine && lineStyles[selectedLine] === "dashed"
                  ? "contained"
                  : "outlined"
              }
              size="small"
              disabled={!selectedLine}
              onClick={() => updateLineStyle(selectedLine, "dashed")}
              sx={{ minWidth: "80px" }}
            >
              Dashed
            </Button>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant={
                selectedLine && lineStyles[selectedLine] === "dotted"
                  ? "contained"
                  : "outlined"
              }
              size="small"
              disabled={!selectedLine}
              onClick={() => updateLineStyle(selectedLine, "dotted")}
              sx={{ minWidth: "80px" }}
            >
              Dotted
            </Button>
            <Button
              variant={
                selectedLine && lineStyles[selectedLine] === "arrow"
                  ? "contained"
                  : "outlined"
              }
              size="small"
              disabled={!selectedLine}
              onClick={() => updateLineStyle(selectedLine, "arrow")}
              sx={{ minWidth: "80px" }}
            >
              Arrow
            </Button>
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={() => setScale((prev) => Math.min(prev + 0.1, 2))}
            disabled={scale >= 2}
          >
            +
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => setScale((prev) => Math.max(prev - 0.1, 0.5))}
            disabled={scale <= 0.5}
          >
            -
          </Button>
          <Button variant="contained" size="small" onClick={() => setScale(1)}>
            Reset
          </Button>
        </Box>
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>Add Sub-Node to {selectedNode?.name}</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="Sub-Node Name"
              fullWidth
              variant="outlined"
              value={subNodeName}
              onChange={(e) => setSubNodeName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddSubNode()}
              sx={{ minWidth: "300px" }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setDialogOpen(false);
                setSubNodeName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSubNode}
              color="primary"
              variant="contained"
              disabled={!subNodeName.trim()}
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default InteractiveTreeDiagram;
