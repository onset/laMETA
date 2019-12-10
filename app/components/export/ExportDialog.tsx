import * as React from "react";
import ReactModal from "react-modal";
import "./ExportDialog.scss";
import CloseOnEscape from "react-close-on-escape";
import CsvExporter from "../../export/CsvExporter";
import { ProjectHolder } from "../../model/Project/Project";
import { showInExplorer } from "../../crossPlatformUtilities";
import { remote } from "electron";
import * as Path from "path";
import { Trans } from "@lingui/react";
import { t } from "@lingui/macro";
import { i18n } from "../../localization";
import { analyticsLocation, analyticsEvent } from "../../analytics";
import ImdiBundler from "../../export/ImdiBundler";
import moment from "moment";
const { app } = require("electron").remote;
const sanitize = require("sanitize-filename");

// tslint:disable-next-line:no-empty-interface
interface IProps {
  projectHolder: ProjectHolder;
}
interface IState {
  isOpen: boolean;
  selectedOption: string;
}
export default class ExportDialog extends React.Component<IProps, IState> {
  private static singleton: ExportDialog;

  constructor(props: IProps) {
    super(props);
    ExportDialog.singleton = this;
    this.state = { isOpen: false, selectedOption: "csv" };
  }

  private handleCloseModal(doSave: boolean) {
    if (doSave) {
      const defaultPath =
        this.state.selectedOption === "csv"
          ? this.getPathForCsvSaving()
          : this.getPathForIMDISaving();
      remote.dialog.showSaveDialog(
        {
          title: i18n._(t`Save As`),
          defaultPath: defaultPath,
          filters: [
            {
              extensions: ["zip"],
              name: i18n._(t`ZIP Archive`)
            }
          ]
        },
        path => this.saveFiles(path)
      );
    } else {
      this.setState({ isOpen: false });
    }
  }
  private getPathForCsvSaving() {
    return `${Path.basename(this.props.projectHolder.project!.directory)}-${
      this.state.selectedOption
    }.zip`;
  }

  private getPathForIMDISaving(): string {
    const rootDirectoryForAllExports = Path.join(
      app.getPath("documents"),
      "SayMore",
      "IMDI Packages"
    );
    return Path.join(
      rootDirectoryForAllExports,
      sanitize(this.props.projectHolder.project!.displayName) +
        "_" +
        moment(new Date()).format("YYYY-MM-DD")
    );
  }

  private saveFiles(path: string) {
    if (path) {
      switch (this.state.selectedOption) {
        case "csv":
          analyticsEvent("Export", "Export CSV");
          const exporter = new CsvExporter(this.props.projectHolder.project!);
          exporter.makeZipFile(path);
          showInExplorer(path);
          break;
        case "imdi":
          analyticsEvent("Export", "Export IMDI Xml");
          ImdiBundler.saveImdiBundleToFolder(
            this.props.projectHolder.project!,
            path,
            false
          );
          break;
        case "imdi-plus-files":
          analyticsEvent("Export", "Export IMDI Plus Files");
          ImdiBundler.saveImdiBundleToFolder(
            this.props.projectHolder.project!,
            path,
            true
          );
          break;
      }
      showInExplorer(path);
      this.setState({ isOpen: false });
    }
  }
  private handleOptionChange(changeEvent) {
    this.setState({
      selectedOption: changeEvent.target.value
    });
  }

  public static async show() {
    ExportDialog.singleton.setState({
      isOpen: true
    });
  }
  public render() {
    const selectedOption = this.state.selectedOption;
    return (
      <CloseOnEscape
        onEscape={() => {
          this.handleCloseModal(false);
        }}
      >
        <ReactModal
          className="exportDialog"
          isOpen={this.state.isOpen}
          shouldCloseOnOverlayClick={true}
          onRequestClose={() => this.handleCloseModal(false)}
          ariaHideApp={false}
          onAfterOpen={() => analyticsLocation("Export Dialog")}
        >
          <div className={"dialogTitle "}>
            <Trans>Export Project</Trans>
          </div>
          <div className="dialogContent">
            <fieldset>
              <legend>
                <Trans>Choose an export format:</Trans>
              </legend>
              <label>
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={selectedOption === "csv"}
                  onChange={e => this.handleOptionChange(e)}
                />
                <Trans>Zip of CSVs</Trans>
              </label>

              <p>
                <Trans>
                  A single zip archive that contains one comma-separated file
                  for each of Project, Session, and People.
                </Trans>
              </p>

              {/* <label>
                <input
                  type="radio"
                  name="format"
                  value="spreadsheet"
                  checked={true}
                  disabled={true}
                />
                Spreadsheet (not implemented yet)
              </label>
              <p>
                A single file with sheets for each of Project, Session, and
                People
              </p> */}

              <label>
                <input
                  type="radio"
                  name="format"
                  value="imdi"
                  checked={selectedOption === "imdi"}
                  onChange={e => this.handleOptionChange(e)}
                />
                IMDI Only
              </label>
              <p>
                <Trans>
                  A zip file with an IMDI file for the project and each session.
                </Trans>
              </p>
              <label>
                <input
                  type="radio"
                  name="format"
                  value="imdi-plus-files"
                  checked={selectedOption === "imdi-plus-files"}
                  onChange={e => this.handleOptionChange(e)}
                />
                IMDI + Files
              </label>
              <p>
                <Trans>
                  A zip file containing both the IMDI files and all the
                  project's archivable files.
                </Trans>
              </p>
            </fieldset>
          </div>
          <div className={"bottomButtonRow"}>
            {/* List as default last (in the corner), then stylesheet will reverse when used on Windows */}
            <div className={"okCancelGroup"}>
              <button onClick={() => this.handleCloseModal(false)}>
                <Trans>Cancel</Trans>
              </button>
              <button id="okButton" onClick={() => this.handleCloseModal(true)}>
                <Trans>Export</Trans>
              </button>
            </div>
          </div>
        </ReactModal>
      </CloseOnEscape>
    );
  }
}
