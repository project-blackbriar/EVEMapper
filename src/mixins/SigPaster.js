export default {
    methods: {
        async deleteSig(index) {
            this.selectedLocation.signatures.splice(index, 1);
            await this.$store.dispatch("updateLocation", {
                location: this.selectedLocation
            });
        },
        async handlePaste(event) {
            event.stopPropagation();
            event.preventDefault();
            if (!this.selectedLocation) {
                return this.$bvToast.toast("No System Selected", {
                    title: "Signature Data",
                    variant: "danger"
                });
            } else {
                if (!this.selectedLocation.signatures) {
                    this.selectedLocation.signatures = [];
                }
                const text = event.clipboardData.getData("Text");
                if (text && text.match(new RegExp("([A-Z]){3}-[0-9]{3}"))) {
                    text.split("\n").map(line => {
                        const sig = line.match(new RegExp("([A-Z]){3}-[0-9]{3}"))[0];
                        if (sig) {
                            const foundSig = this.selectedLocation.signatures.findIndex(v => sig === v.code);
                            if (foundSig === -1) {
                                this.selectedLocation.signatures.push({
                                    ...this.parseSigLine(sig, line),
                                    created: Date.now(),
                                    updated: Date.now()
                                });
                            } else {
                                this.selectedLocation.signatures[foundSig] = {
                                    ...this.selectedLocation.signatures[foundSig],
                                    ...this.parseSigLine(sig, line),
                                    updated: Date.now()
                                };
                            }
                        }
                    });
                    this.selectedLocation.signatures = _.sortBy(this.selectedLocation.signatures, ['code']);
                    await this.$store.dispatch("updateLocation", {
                        location: this.selectedLocation
                    });
                }
            }
        },
        parseSigLine(code, line) {
            return {
                code,
                ...this.determineSigData(line)
            };
        },
        determineSigData(line) {
            const tabbed = line.split('\t');
            const named = tabbed[3] !== '\t';
            return {
                cosmicType: tabbed[1],
                type: tabbed[2],
                name: tabbed[3],
                percent: named ? tabbed[4] : tabbed[5]
            };
        }
    }

};
