import React from "react";
import { Card, CardContent, Typography, Grid } from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";

type ResultEntry = {
  entity: string;
  property: string;
  message: string;
  clause: string;
};

const ValidationResult: React.FC<{
  kind: "error" | "info" | "warning";
  problem: ResultEntry;
}> = (props) => {
  return (
    <Card style={{ width: "100%", marginBottom: "20px" }}>
      <CardContent>
        <Grid container spacing={1} wrap="wrap">
          <Grid item>
            {props.kind === "error" && <ErrorIcon color="error" />}
            {props.kind === "info" && <InfoIcon color="success" />}
            {props.kind === "warning" && <WarningIcon color="warning" />}
          </Grid>
          <Grid item>
            <Typography variant="body1" color="black">
              {`${props.problem.entity}  ${props.problem.property}`}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="body1" color="error">
              {props.problem.message}
            </Typography>
          </Grid>
        </Grid>
        <Typography variant="body2" color="textSecondary">
          {props.problem.clause}
        </Typography>
      </CardContent>
    </Card>
  );
};

const ValidationResultsList: React.FC<{ list: { errors; info; warnings } }> = (
  props
) => {
  return (
    <Grid container spacing={0} style={{ width: "100%", margin: 0 }}>
      {props.list.errors.map((item, index) => (
        <Grid item key={index}>
          <ValidationResult kind={"error"} problem={item as ResultEntry} />
        </Grid>
      ))}
      {props.list.warnings.map((item, index) => (
        <Grid item key={index}>
          <ValidationResult kind={"warning"} problem={item as ResultEntry} />
        </Grid>
      ))}
      {props.list.info.map((item, index) => (
        <Grid item key={index}>
          <ValidationResult kind={"info"} problem={item as ResultEntry} />
        </Grid>
      ))}
    </Grid>
  );
};

export { ValidationResultsList };
