module.exports = function (grunt) {
	grunt.initConfig({
		jshint: {
			src: [
				"**/*.js",
				"!{node_modules,out}/**/*.js"
			],
			options: {
				jshintrc: ".jshintrc"
			}
		},
		intern: {
			node: {
				options: {
					runType: "client",
					config: "tests/intern"
				}
			},
			local: {
				options: {
					runType: "runner",
					config: "tests/intern.local",
					reporters: ["runner"]
				}
			},
			remote: {
				options: {
					runType: "runner",
					config: "tests/intern",
					reporters: ["runner"]
				}
			}
		},
		"jsdoc-amddcl": {
			docs: {
				files: [
					{
						args: [
							"-r"
						],
						src: [
							".",
							"./README.md",
							"./package.json"
						]
					}
				]
			},
			export: {
				files: [
					{
						args: [
							"-X",
							"-r"
						],
						src: [
							".",
							"./README.md",
							"./package.json"
						],
						dest: "./out/doclets.json"
					}
				]
			}
		}
	});
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("intern");
	grunt.loadNpmTasks("jsdoc-amddcl");
	grunt.registerTask("jsdoc", "jsdoc-amddcl");
};
